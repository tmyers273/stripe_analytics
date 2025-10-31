-- AWS Athena table definition for querying Stripe webhooks stored in S3
-- This allows you to query your webhook data using SQL

-- Step 1: Create database (if not exists)
CREATE DATABASE IF NOT EXISTS stripe_analytics
COMMENT 'Database for Stripe webhook analytics'
LOCATION 's3://your-company-stripe-webhooks/athena-results/';

-- Step 2: Create external table for webhook data
CREATE EXTERNAL TABLE IF NOT EXISTS stripe_analytics.webhooks (
    timestamp STRING COMMENT 'ISO 8601 timestamp when webhook was received',
    type STRING COMMENT 'Stripe event type (e.g., charge.succeeded)',
    id STRING COMMENT 'Stripe event ID',
    data STRUCT<
        id: STRING,
        object: STRING,
        api_version: STRING,
        created: BIGINT,
        data: STRUCT<
            object: STRING,
            -- Add specific fields you care about
            -- Example for charge events:
            amount: BIGINT,
            currency: STRING,
            customer: STRING,
            status: STRING
        >,
        livemode: BOOLEAN,
        pending_webhooks: INT,
        request: STRUCT<
            id: STRING,
            idempotency_key: STRING
        >,
        type: STRING
    > COMMENT 'Full Stripe event payload'
)
COMMENT 'Stripe webhook events stored via Kinesis Firehose'
PARTITIONED BY (
    year STRING,
    month STRING,
    day STRING
)
ROW FORMAT SERDE 'org.openx.data.jsonserde.JsonSerDe'
WITH SERDEPROPERTIES (
    'ignore.malformed.json' = 'true'
)
LOCATION 's3://your-company-stripe-webhooks/webhooks/'
TBLPROPERTIES (
    'projection.enabled' = 'true',
    'projection.year.type' = 'integer',
    'projection.year.range' = '2024,2030',
    'projection.month.type' = 'integer',
    'projection.month.range' = '01,12',
    'projection.month.digits' = '2',
    'projection.day.type' = 'integer',
    'projection.day.range' = '01,31',
    'projection.day.digits' = '2',
    'storage.location.template' = 's3://your-company-stripe-webhooks/webhooks/year=${year}/month=${month}/day=${day}/'
);

-- Step 3: Load partitions (alternative to partition projection)
-- Only needed if not using partition projection above
-- MSCK REPAIR TABLE stripe_analytics.webhooks;

-- Example Queries

-- 1. Count webhooks by type for today
SELECT
    type,
    COUNT(*) as count
FROM stripe_analytics.webhooks
WHERE year = CAST(YEAR(CURRENT_DATE) AS VARCHAR)
    AND month = LPAD(CAST(MONTH(CURRENT_DATE) AS VARCHAR), 2, '0')
    AND day = LPAD(CAST(DAY(CURRENT_DATE) AS VARCHAR), 2, '0')
GROUP BY type
ORDER BY count DESC;

-- 2. Count webhooks by type and date (last 30 days)
SELECT
    type,
    year || '-' || month || '-' || day as date,
    COUNT(*) as count
FROM stripe_analytics.webhooks
WHERE CAST(year || month || day AS INT) >= CAST(FORMAT_DATETIME(DATE_ADD('day', -30, CURRENT_DATE), 'yyyyMMdd') AS INT)
GROUP BY type, year, month, day
ORDER BY date DESC, count DESC;

-- 3. Find specific event by ID
SELECT
    timestamp,
    type,
    data
FROM stripe_analytics.webhooks
WHERE id = 'evt_1234567890abcdef'
LIMIT 1;

-- 4. Analyze charge events
SELECT
    DATE(from_iso8601_timestamp(timestamp)) as date,
    COUNT(*) as total_charges,
    SUM(CAST(data.data.amount AS DECIMAL) / 100) as total_amount,
    AVG(CAST(data.data.amount AS DECIMAL) / 100) as avg_amount,
    data.data.currency as currency
FROM stripe_analytics.webhooks
WHERE type = 'charge.succeeded'
    AND year = '2025'
    AND month = '10'
GROUP BY DATE(from_iso8601_timestamp(timestamp)), data.data.currency
ORDER BY date DESC;

-- 5. Monitor webhook volume by hour
SELECT
    DATE_TRUNC('hour', from_iso8601_timestamp(timestamp)) as hour,
    COUNT(*) as webhook_count
FROM stripe_analytics.webhooks
WHERE year = CAST(YEAR(CURRENT_DATE) AS VARCHAR)
    AND month = LPAD(CAST(MONTH(CURRENT_DATE) AS VARCHAR), 2, '0')
    AND day = LPAD(CAST(DAY(CURRENT_DATE) AS VARCHAR), 2, '0')
GROUP BY DATE_TRUNC('hour', from_iso8601_timestamp(timestamp))
ORDER BY hour DESC;

-- 6. Find failed payments
SELECT
    timestamp,
    data.id as charge_id,
    data.data.customer as customer_id,
    CAST(data.data.amount AS DECIMAL) / 100 as amount,
    data.data.currency as currency,
    data.data.failure_message as failure_reason
FROM stripe_analytics.webhooks
WHERE type = 'charge.failed'
    AND year = '2025'
    AND month = '10'
ORDER BY timestamp DESC
LIMIT 100;

-- 7. Customer creation rate
SELECT
    DATE(from_iso8601_timestamp(timestamp)) as date,
    COUNT(*) as new_customers
FROM stripe_analytics.webhooks
WHERE type = 'customer.created'
    AND CAST(year || month || day AS INT) >= CAST(FORMAT_DATETIME(DATE_ADD('day', -90, CURRENT_DATE), 'yyyyMMdd') AS INT)
GROUP BY DATE(from_iso8601_timestamp(timestamp))
ORDER BY date DESC;

-- 8. Check for webhook delivery delays
-- Compares webhook received timestamp vs Stripe created timestamp
SELECT
    type,
    AVG(
        DATE_DIFF('second',
            from_unixtime(data.created),
            from_iso8601_timestamp(timestamp)
        )
    ) as avg_delay_seconds,
    COUNT(*) as count
FROM stripe_analytics.webhooks
WHERE year = CAST(YEAR(CURRENT_DATE) AS VARCHAR)
    AND month = LPAD(CAST(MONTH(CURRENT_DATE) AS VARCHAR), 2, '0')
GROUP BY type
HAVING COUNT(*) > 10
ORDER BY avg_delay_seconds DESC;

-- 9. Most active customers (by webhook volume)
SELECT
    data.data.customer as customer_id,
    COUNT(*) as webhook_count,
    COUNT(DISTINCT type) as unique_event_types
FROM stripe_analytics.webhooks
WHERE data.data.customer IS NOT NULL
    AND CAST(year || month || day AS INT) >= CAST(FORMAT_DATETIME(DATE_ADD('day', -30, CURRENT_DATE), 'yyyyMMdd') AS INT)
GROUP BY data.data.customer
ORDER BY webhook_count DESC
LIMIT 50;

-- 10. Webhook health check - find gaps in delivery
WITH hourly_counts AS (
    SELECT
        DATE_TRUNC('hour', from_iso8601_timestamp(timestamp)) as hour,
        COUNT(*) as count
    FROM stripe_analytics.webhooks
    WHERE CAST(year || month || day AS INT) >= CAST(FORMAT_DATETIME(DATE_ADD('day', -1, CURRENT_DATE), 'yyyyMMdd') AS INT)
    GROUP BY DATE_TRUNC('hour', from_iso8601_timestamp(timestamp))
)
SELECT
    hour,
    count,
    CASE
        WHEN count = 0 THEN 'NO_WEBHOOKS'
        WHEN count < 10 THEN 'LOW_VOLUME'
        ELSE 'NORMAL'
    END as status
FROM hourly_counts
ORDER BY hour DESC;
