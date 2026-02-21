%sql
CREATE TABLE IF NOT EXISTS ${catalog}.${schema}.dbspend360_dbu_cost (
  cluster_id      STRING,
  job_id          STRING,
  run_id          STRING,
  usage_date      DATE,
  databricks_cost DOUBLE,
  currency        STRING,      
  sku_name        STRING,
  workspace_id    STRING,
  created_at      TIMESTAMP,
  updated_at      TIMESTAMP
)
CLUSTERED BY AUTO