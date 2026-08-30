# Customer Import Format

Use `customers_sample.csv` as a template when bulk-importing customers.

## Supported file types

| Format | Extension |
|--------|-----------|
| CSV (comma-separated) | `.csv` |
| Excel workbook | `.xlsx` |
| Excel 97–2003 | `.xls` |

Max file size: **10 MB**. Only the first sheet is read for `.xlsx`/`.xls`.

## Column reference

| Column header | Field | Required | Accepted values |
|---------------|-------|----------|-----------------|
| `name` / `company` / `company name` | Company name | **Yes** | Any text, max 200 chars |
| `account type` / `type` | Account type | No | `prospect` · `active` · `inactive` · `churned` (defaults to `prospect`) |
| `company size` / `size` / `employees` | Employee range | No | `1-10` · `11-50` · `51-200` · `201-1000` · `1001+` |
| `industry` / `sector` | Industry | No | Free text, max 120 chars |
| `website` / `url` | Website URL | No | Full URL (`https://…`) — protocol added automatically if omitted |
| `contact person` / `contact` / `primary contact` | Primary contact name | No | Max 120 chars |
| `email` / `contact email` | Primary email | No | Valid email format |
| `phone` / `phone number` | Primary phone | No | Any format, max 30 chars |
| `secondary contact name` / `alt contact` | Secondary contact name | No | Max 120 chars |
| `secondary contact email` / `alt email` | Secondary email | No | Valid email format |
| `secondary contact phone` / `alt phone` | Secondary phone | No | Max 30 chars |
| `address` / `street address` | Street address | No | Max 300 chars |
| `city` / `town` | City | No | Max 120 chars |
| `state/province` / `state` / `region` | State or province | No | Max 120 chars |
| `postal code` / `zip` / `postcode` | Postal / ZIP code | No | Max 40 chars |
| `country` / `nation` | Country | No | Max 120 chars |
| `vat number` / `vat` / `tax id` | VAT / Tax ID | No | Max 80 chars |
| `registration number` / `reg number` | Company registration | No | Max 80 chars |
| `payment terms` / `terms` | Payment terms | No | Free text, max 120 chars |
| `notes` / `comments` / `remarks` | Internal notes | No | Max 2000 chars |

## Rules

- Column headers are case-insensitive and trimmed — `Account Type`, `account type`, and `ACCOUNT TYPE` all work.
- Rows with an empty `name` column are skipped and reported as errors.
- Rows with an invalid primary or secondary email are skipped.
- If `account type` is not one of the accepted values it defaults to `prospect`.
- If `company size` is not one of the accepted ranges it is ignored (field left blank).
- Duplicate customer names (case-insensitive) are skipped with an error message.
- Extra columns not listed above are silently ignored.
- The import result shows a count of created vs. skipped rows, and a per-row error list.
