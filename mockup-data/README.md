# mockup-data

Sample data files for development, testing, and onboarding new team members.
All files here can be imported directly through the MachineIQ UI.

## Structure

```
mockup-data/
└── customers/
    ├── customers_sample.csv   — 5 realistic customer records covering supported fields
    └── README.md              — Column reference for the customer import format
```

## How to use

1. Start the dev servers: `./dev.sh`
2. Log in as `admin@machineiq.com` / `password123`
3. Navigate to **Customers** → click **Import**
4. Upload a file from this folder
5. Review the results summary

## Adding more sample data

When adding new sample files:
- Name them `<entity>_sample.<ext>` (e.g. `opportunities_sample.csv`)
- Place them in a subfolder matching the entity (e.g. `mockup-data/opportunities/`)
- Keep a `README.md` in each subfolder with the column reference
