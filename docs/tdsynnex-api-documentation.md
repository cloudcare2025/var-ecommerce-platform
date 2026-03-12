# TD SYNNEX API Documentation

## Table of Contents

- [Overview](#overview)
- [API Integration Methods](#api-integration-methods)
- [REST Partner API](#rest-partner-api)
  - [Authentication (OAuth2)](#authentication-oauth2)
  - [API Key](#api-key)
  - [Credential Management](#credential-management)
  - [Quotes](#quotes)
  - [Orders](#orders)
  - [Invoices](#invoices)
- [XML Price & Availability API](#xml-price--availability-api)
  - [Authentication (XML)](#authentication-xml)
  - [Price & Availability Request](#price--availability-request)
  - [Price & Availability Response](#price--availability-response)
  - [Querying by Manufacturer Part Number](#querying-by-manufacturer-part-number)
- [SOAP Web Services](#soap-web-services)
- [Common Response Schema](#common-response-schema)
- [Error Handling](#error-handling)
- [Rate Limits](#rate-limits)
- [Integration Notes](#integration-notes)
- [Warehouse Reference](#warehouse-reference)

---

## Overview

TD SYNNEX provides **three distinct API integration methods**, each serving different purposes:

| Method | Purpose | Auth Method | Format |
| ------ | ------- | ----------- | ------ |
| **REST Partner API** | Quotes, Orders, Invoices | OAuth2 / API Key | JSON |
| **XML PNA API** | Price & Availability lookups | Username/Password in XML | XML |
| **SOAP Web Services** | P&A, PO submission, PO status | SOAP/WSDL | XML/SOAP |

---

## API Integration Methods

### Summary of Endpoints

| API | Base URL | Purpose |
| --- | -------- | ------- |
| REST Partner API | `https://api.us.tdsynnex.com` | Order management (quotes, orders, invoices) |
| XML PNA API | `https://ec.us.tdsynnex.com/SynnexXML/PriceAvailability` | Product price & availability by SKU or MPN |
| SOAP P&A | `https://ws.synnex.com/webservice/pnaserviceV05?wsdl` | SOAP-based price & availability |
| SOAP PO | `https://ws.synnex.com/webservice/poserviceV02?wsdl` | SOAP-based purchase order submission |
| SOAP PO Status | `https://ws.synnex.com/webservice/posserviceV02?wsdl` | SOAP-based PO status queries |
| PartnerFirst Portal | `https://partnerfirst.us.tdsynnex.com` | Web UI for browsing, search, ordering |
| Developer Portal | `https://api.synnex.com/api-center/reseller/home` | API credential management |

---

## REST Partner API

| Property        | Value                                    |
| --------------- | ---------------------------------------- |
| API Name        | TD SYNNEX Partner API v1.0               |
| Developer Portal| https://api.synnex.com/api-center/reseller/home |
| API Type        | REST                                     |
| Base URL        | `https://api.us.tdsynnex.com`            |
| OAuth Token URL | `https://sso.us.tdsynnex.com/oauth2/v1/token` |
| Token Lifetime  | 7200 seconds (2 hours)                   |

The REST Partner API provides programmatic access to query quotes, orders, shipments, and invoices. It does **NOT** provide product catalog browsing or pricing lookups — use the XML PNA API for that.

### Authentication (OAuth2)

This is the recommended method for production integrations. It uses the standard OAuth2 Client Credentials grant flow.

**Token Request:**

```
POST https://sso.us.tdsynnex.com/oauth2/v1/token
Content-Type: application/x-www-form-urlencoded
```

**Parameters:**

| Parameter       | Type   | Required | Description                        |
| --------------- | ------ | -------- | ---------------------------------- |
| `grant_type`    | string | Yes      | Must be `client_credentials`       |
| `client_id`     | string | Yes      | Your OAuth client ID               |
| `client_secret` | string | Yes      | Your OAuth client secret           |

**Example Request:**

```bash
curl -X POST https://sso.us.tdsynnex.com/oauth2/v1/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET"
```

**Example Response:**

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6...",
  "token_type": "Bearer",
  "expires_in": 7200
}
```

**Using the Token:**

Include the access token as a Bearer token in the `Authorization` header on all subsequent API requests:

```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6...
```

Tokens expire after **7200 seconds (2 hours)**. Your integration should handle token refresh by requesting a new token before or when the current one expires.

### API Key

Intended for testing and proof-of-concept work. Not recommended for production.

Include your API key in the `x-api-key` header:

```
x-api-key: YOUR_API_KEY
```

**Example Request:**

```bash
curl -X GET "https://api.us.tdsynnex.com/api/v1/orders/orderNo/12345" \
  -H "x-api-key: YOUR_API_KEY"
```

---

## Credential Management

Credentials are managed through the TD SYNNEX Developer Portal.

| Item                         | Detail                                              |
| ---------------------------- | --------------------------------------------------- |
| Portal Location              | My Account -> Client Credentials                    |
| Environment Specificity      | Credentials are tied to a specific environment (PROD or Sandbox) |
| Secret Visibility            | Client Secret is only displayed **once** at creation time. Store it securely immediately. |
| Who Can Generate             | Only organization administrators can generate credentials |
| Activation Delay             | New credentials may take **up to 10 minutes** to activate |

**Best Practices:**

- Store credentials in a secrets manager or environment variables. Never commit them to source control.
- Rotate credentials periodically.
- Use Sandbox credentials during development and testing; switch to PROD credentials only for live integrations.
- Record your Client Secret immediately upon creation since it cannot be retrieved later.

---

## API Endpoints

All endpoints use the base URL `https://api.us.tdsynnex.com`. All requests require authentication via either Bearer token or API key header.

### Quotes

#### Get Quote Status by Order Number

Retrieve the status of a partner quote using the associated order number.

```
GET /api/v1/webservice/ltd/partner/order/{orderNo}/QUOTEID
```

**Path Parameters:**

| Parameter | Type   | Required | Description                    |
| --------- | ------ | -------- | ------------------------------ |
| `orderNo` | string | Yes      | The order number to look up    |

**Authentication:** Bearer Token (`bearerAuth`)

**Example Request:**

```bash
curl -X GET "https://api.us.tdsynnex.com/api/v1/webservice/ltd/partner/order/12345/QUOTEID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response (200 OK):**

Returns an array of quote objects. See [Common Response Schema](#common-response-schema) for the full object structure.

```json
[
  {
    "orderNumber": "12345",
    "invoiceNumber": "INV-001",
    "purchaseOrderNumber": "PO-2025-001",
    "salesOrderNumber": "SO-2025-001",
    "orderStatus": "Open",
    "orderStatusCode": "O",
    "orderPlacedDate": "2025-06-15T14:30:00Z",
    "total": 5250.00,
    "tax": 420.00,
    "freight": 25.00,
    "otherFees": 0.00,
    "resellerContactName": "John Smith",
    "shipTo": {
      "...": "address details"
    },
    "endUser": {
      "...": "end user details"
    },
    "lines": [
      {
        "...": "line item details"
      }
    ],
    "uniqueID": "abc-123-def",
    "errorMessage": null
  }
]
```

---

### Orders

#### Get Order by Order Number

Retrieve order information using the order number.

```
GET /api/v1/orders/orderNo/{orderNo}
```

**Path Parameters:**

| Parameter | Type   | Required | Description                    |
| --------- | ------ | -------- | ------------------------------ |
| `orderNo` | string | Yes      | The order number to look up    |

**Example Request:**

```bash
curl -X GET "https://api.us.tdsynnex.com/api/v1/orders/orderNo/12345" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response (200 OK):**

Returns an array of order objects. Schema matches the [Common Response Schema](#common-response-schema).

---

#### Get Order by Order Number and Order Type

Retrieve order information filtered by both order number and order type.

```
GET /api/v1/orders/orderNo/{orderNo}/orderType/{orderType}
```

**Path Parameters:**

| Parameter   | Type   | Required | Description                                      |
| ----------- | ------ | -------- | ------------------------------------------------ |
| `orderNo`   | string | Yes      | The order number to look up                      |
| `orderType` | string | Yes      | The order type: `SO` (Sales Order) or `PO` (Purchase Order) |

**Example Request:**

```bash
curl -X GET "https://api.us.tdsynnex.com/api/v1/orders/orderNo/12345/orderType/SO" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response (200 OK):**

Returns an array of order objects. Schema matches the [Common Response Schema](#common-response-schema).

---

#### Get Order Shipment Details

Retrieve shipment tracking and status details for a specific order.

```
GET /api/v1/orders/shipment/details/orderNo/{orderNo}
```

**Path Parameters:**

| Parameter | Type   | Required | Description                    |
| --------- | ------ | -------- | ------------------------------ |
| `orderNo` | string | Yes      | The order number to look up    |

**Example Request:**

```bash
curl -X GET "https://api.us.tdsynnex.com/api/v1/orders/shipment/details/orderNo/12345" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response (200 OK):**

```json
{
  "orderNumber": "12345",
  "purchaseOrder": "PO-2025-001",
  "orderStatus": "Shipped",
  "orderStatusCode": "S",
  "lines": [
    {
      "...": "line items with shipment tracking details"
    }
  ],
  "uniqueID": "abc-123-def",
  "errorMessage": null
}
```

**Shipment Response Fields:**

| Field              | Type   | Description                            |
| ------------------ | ------ | -------------------------------------- |
| `orderNumber`      | string | The order number                       |
| `purchaseOrder`    | string | The associated purchase order number   |
| `orderStatus`      | string | Human-readable order status            |
| `orderStatusCode`  | string | Machine-readable status code           |
| `lines`            | array  | Line items with shipment details       |
| `uniqueID`         | string | Unique identifier for the response     |
| `errorMessage`     | string | Error message if applicable, otherwise null |

---

### Invoices

#### Get Invoice by Invoice Number and Invoice Type

Retrieve invoice details using the invoice number and type.

```
GET /api/v1/invoices/invoiceNo/{invoiceNo}/invoiceType/{invoiceType}
```

**Path Parameters:**

| Parameter     | Type   | Required | Description                                                        |
| ------------- | ------ | -------- | ------------------------------------------------------------------ |
| `invoiceNo`   | string | Yes      | The invoice number to look up                                      |
| `invoiceType` | string | Yes      | The invoice type: `IV` (Invoice), `PO` (Purchase Order), or `SO` (Sales Order) |

**Example Request:**

```bash
curl -X GET "https://api.us.tdsynnex.com/api/v1/invoices/invoiceNo/INV-001/invoiceType/IV" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response (200 OK):**

Returns an array of invoice objects.

```json
[
  {
    "shipComplete": true,
    "currency": "USD",
    "paymentTerms": "Net 30",
    "status": "Paid",
    "shipDate": "2025-06-16T00:00:00Z",
    "netFreight": 25.00,
    "netInvoiceDollars": 5250.00,
    "taxInDocumentCurrency": 420.00,
    "handlingCharge": 0.00,
    "stateFee": 0.00,
    "plantDescription": "Warehouse A",
    "actualFreight": 22.50,
    "salesOrderNumber": "SO-2025-001",
    "purchaseOrderNumber": "PO-2025-001",
    "invoiceNumber": "INV-001",
    "invoiceDate": "2025-06-16T00:00:00Z",
    "invoiceDueDate": "2025-07-16T00:00:00Z",
    "totalInvoiceAmount": 5695.00,
    "invoiceBalance": 0.00,
    "customerName": "Acme Corp",
    "customerNumber": "CUST-001",
    "contactName": "John Smith",
    "endUserPO": "EU-PO-001",
    "floorplan": null,
    "blindPackaging": false,
    "soldToAddress": {
      "...": "address details"
    },
    "vendorShipTracking": {
      "...": "tracking details"
    },
    "lines": [
      {
        "...": "line item details"
      }
    ],
    "handlingUnits": [
      {
        "...": "handling unit details"
      }
    ]
  }
]
```

**Invoice Response Fields:**

| Field                     | Type    | Description                                    |
| ------------------------- | ------- | ---------------------------------------------- |
| `shipComplete`            | boolean | Whether the shipment is complete               |
| `currency`                | string  | Currency code (e.g., "USD")                    |
| `paymentTerms`            | string  | Payment terms description                      |
| `status`                  | string  | Invoice status                                 |
| `shipDate`                | string  | Ship date (ISO 8601)                           |
| `netFreight`              | number  | Net freight charge                             |
| `netInvoiceDollars`       | number  | Net invoice amount                             |
| `taxInDocumentCurrency`   | number  | Tax amount in document currency                |
| `handlingCharge`          | number  | Handling charge                                |
| `stateFee`                | number  | State fee                                      |
| `plantDescription`        | string  | Description of fulfillment plant/warehouse     |
| `actualFreight`           | number  | Actual freight cost                            |
| `salesOrderNumber`        | string  | Associated sales order number                  |
| `purchaseOrderNumber`     | string  | Associated purchase order number               |
| `invoiceNumber`           | string  | Invoice number                                 |
| `invoiceDate`             | string  | Invoice issue date (ISO 8601)                  |
| `invoiceDueDate`          | string  | Invoice due date (ISO 8601)                    |
| `totalInvoiceAmount`      | number  | Total invoice amount                           |
| `invoiceBalance`          | number  | Remaining balance on the invoice               |
| `customerName`            | string  | Customer name                                  |
| `customerNumber`          | string  | Customer account number                        |
| `contactName`             | string  | Contact name                                   |
| `endUserPO`               | string  | End user purchase order reference               |
| `floorplan`               | string  | Floorplan information (nullable)               |
| `blindPackaging`          | boolean | Whether blind packaging is applied             |
| `soldToAddress`           | object  | Sold-to address details                        |
| `vendorShipTracking`      | object  | Vendor shipment tracking information           |
| `lines`                   | array   | Invoice line items                             |
| `handlingUnits`           | array   | Handling unit details                          |

---

## Common Response Schema

The quote and order endpoints share a common response object structure.

| Field                   | Type   | Description                                      |
| ----------------------- | ------ | ------------------------------------------------ |
| `orderNumber`           | string | The order number                                 |
| `invoiceNumber`         | string | Associated invoice number                        |
| `purchaseOrderNumber`   | string | Purchase order number                            |
| `salesOrderNumber`      | string | Sales order number                               |
| `orderStatus`           | string | Human-readable status (e.g., "Open")             |
| `orderStatusCode`       | string | Machine-readable status code                     |
| `orderPlacedDate`       | string | Date the order was placed (ISO 8601)             |
| `total`                 | number | Order total amount                               |
| `tax`                   | number | Tax amount                                       |
| `freight`               | number | Freight/shipping charge                          |
| `otherFees`             | number | Any additional fees                              |
| `resellerContactName`   | string | Name of the reseller contact                     |
| `shipTo`                | object | Ship-to address details                          |
| `endUser`               | object | End user information                             |
| `lines`                 | array  | Array of line item objects                       |
| `uniqueID`              | string | Unique identifier for the response               |
| `errorMessage`          | string | Error details if applicable, otherwise null       |

---

## Error Handling

The API uses standard HTTP status codes to indicate success or failure.

| Status Code | Name                  | Description                                                |
| ----------- | --------------------- | ---------------------------------------------------------- |
| 200         | OK                    | Request succeeded. Response body contains the requested data. |
| 400         | Bad Request           | The request was malformed or contained invalid input parameters. Check your path parameters and request format. |
| 401         | Unauthorized          | Authentication failed. The token may be expired or missing, or the API key is invalid. |
| 429         | Too Many Requests     | Rate limit exceeded. Back off and retry after a delay.     |
| 500         | Internal Server Error | An unexpected error occurred on the TD SYNNEX server. Retry the request or contact support if the issue persists. |

**Error Handling Best Practices:**

- **401 responses:** Check if your OAuth token has expired (tokens last 2 hours). If so, request a new token and retry.
- **429 responses:** Implement exponential backoff. Wait before retrying and reduce request frequency.
- **500 responses:** These are server-side issues. Log the error, wait briefly, and retry. If persistent, contact TD SYNNEX support.
- Always check the `errorMessage` field in response objects for API-level error details that may accompany a 200 status code.

---

## Rate Limits

- Rate limits are enforced **per API key or OAuth client**.
- When you exceed the rate limit, the API returns a `429 Too Many Requests` response.
- There is no publicly documented requests-per-minute threshold; monitor your 429 responses and adjust accordingly.

**Recommendations:**

- Cache responses where appropriate to reduce redundant calls.
- Implement exponential backoff when encountering 429 responses.
- Avoid polling endpoints in tight loops; use reasonable intervals between requests.

---

## Integration Notes

### Environment Configuration

| Environment | Base URL                          | Token URL                                      |
| ----------- | --------------------------------- | ---------------------------------------------- |
| Production  | `https://api.us.tdsynnex.com`     | `https://sso.us.tdsynnex.com/oauth2/v1/token`  |
| Sandbox     | Use Sandbox-specific credentials  | Same token URL with Sandbox credentials         |

Credentials are **environment-specific**. PROD credentials will not work in Sandbox and vice versa.

### Date Formats

All date fields use **ISO 8601** format:

```
2025-06-15T14:30:00Z
```

### Enum Reference

**Order Type (`orderType`):**

| Value | Description     |
| ----- | --------------- |
| `SO`  | Sales Order     |
| `PO`  | Purchase Order  |

**Invoice Type (`invoiceType`):**

| Value | Description     |
| ----- | --------------- |
| `IV`  | Invoice         |
| `PO`  | Purchase Order  |
| `SO`  | Sales Order     |

### REST API Scope and Limitations

- The REST Partner API is currently **read-only** and focused on querying existing quotes, orders, and invoices.
- There are **no REST endpoints** for:
  - Product catalog browsing
  - Pricing lookups
  - Creating or submitting new orders
  - Inventory/availability checks
- **For product pricing and availability**, use the [XML PNA API](#xml-price--availability-api) documented below.

### Token Lifecycle Example

Below is a simplified example of how to manage the OAuth token lifecycle in a Node.js integration:

```typescript
let tokenData: { access_token: string; expires_at: number } | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();

  // Return cached token if still valid (with 5-minute buffer)
  if (tokenData && tokenData.expires_at > now + 5 * 60 * 1000) {
    return tokenData.access_token;
  }

  // Request a new token
  const response = await fetch("https://sso.us.tdsynnex.com/oauth2/v1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.TDSYNNEX_CLIENT_ID!,
      client_secret: process.env.TDSYNNEX_CLIENT_SECRET!,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token request failed: ${response.status}`);
  }

  const data = await response.json();

  tokenData = {
    access_token: data.access_token,
    expires_at: now + data.expires_in * 1000,
  };

  return tokenData.access_token;
}
```

### Quick Reference: All Endpoints

| Method | Endpoint                                                                  | Description                            |
| ------ | ------------------------------------------------------------------------- | -------------------------------------- |
| GET    | `/api/v1/webservice/ltd/partner/order/{orderNo}/QUOTEID`                  | Quote status by order number           |
| GET    | `/api/v1/orders/orderNo/{orderNo}`                                        | Order info by order number             |
| GET    | `/api/v1/orders/orderNo/{orderNo}/orderType/{orderType}`                  | Order info by order number and type    |
| GET    | `/api/v1/orders/shipment/details/orderNo/{orderNo}`                       | Shipment details by order number       |
| GET    | `/api/v1/invoices/invoiceNo/{invoiceNo}/invoiceType/{invoiceType}`        | Invoice by invoice number and type     |

---

## XML Price & Availability API

The XML PNA API is a separate integration from the REST Partner API. It provides **real-time product pricing and warehouse-level availability** — the primary method for looking up product prices and stock on TD SYNNEX.

| Property        | Value                                    |
| --------------- | ---------------------------------------- |
| API Name        | TD SYNNEX XML Price & Availability       |
| Endpoint (Prod) | `https://ec.us.tdsynnex.com/SynnexXML/PriceAvailability` |
| Endpoint (Sandbox) | `https://testec.us.tdsynnex.com/SynnexXML/PriceAvailability` |
| API Type        | XML (HTTP POST)                          |
| Authentication  | EC Express credentials in XML body       |
| Content-Type    | `application/xml`                        |

### Authentication (XML)

The XML PNA API does **NOT** use OAuth. Instead, credentials are embedded directly in the XML request body:

| Credential       | Description                              |
| ---------------- | ---------------------------------------- |
| `customerNo`     | Your TD SYNNEX account number (e.g., `780980`) |
| `userName`       | Your EC Express login email              |
| `password`       | Your EC Express login password           |

These are the same credentials used to log into the EC Express / PartnerFirst portal — they are **different** from the REST API OAuth credentials.

### Price & Availability Request

Query by TD SYNNEX SKU number:

```bash
curl -X POST 'https://ec.us.tdsynnex.com/SynnexXML/PriceAvailability' \
  -H 'Content-Type: application/xml' \
  -d '<?xml version="1.0" encoding="UTF-8" ?>
<priceRequest>
  <customerNo>YOUR_ACCOUNT_NUMBER</customerNo>
  <userName>YOUR_EC_USERNAME</userName>
  <password>YOUR_EC_PASSWORD</password>
  <skuList>
    <synnexSKU>14844700</synnexSKU>
    <lineNumber>1</lineNumber>
  </skuList>
</priceRequest>'
```

**Request Elements:**

| Element         | Required | Description                              |
| --------------- | -------- | ---------------------------------------- |
| `customerNo`    | Yes      | TD SYNNEX customer/account number        |
| `userName`      | Yes      | EC Express login username (email)        |
| `password`      | Yes      | EC Express login password                |
| `skuList`       | Yes      | One or more SKU entries to query         |
| `synnexSKU`     | No*      | TD SYNNEX internal SKU number            |
| `mfgPN`         | No*      | Manufacturer part number (alternative)   |
| `lineNumber`    | Yes      | Sequential line number (1-based)         |

*Either `synnexSKU` or `mfgPN` must be provided in each `skuList` entry. Multiple `skuList` entries can be included in a single request.

### Price & Availability Response

```xml
<?xml version="1.0" encoding="UTF-8"?>
<priceResponse>
  <customerNo>780980</customerNo>
  <userName>user@example.com</userName>
  <PriceAvailabilityList>
    <synnexSKU>13382087</synnexSKU>
    <mfgPN>02-SSC-2825</mfgPN>
    <mfgCode>82781</mfgCode>
    <status>Active</status>
    <description>SONICWALL TZ370</description>
    <GlobalProductStatusCode>Active</GlobalProductStatusCode>
    <price>367.26</price>
    <totalQuantity>9</totalQuantity>
    <AvailabilityByWarehouse>
      <warehouseInfo>
        <number>503</number>
        <zipcode>08085</zipcode>
        <city>Swedesboro,NJ</city>
        <addr>1 Technology Drive</addr>
      </warehouseInfo>
      <qty>9</qty>
    </AvailabilityByWarehouse>
    <lineNumber>1</lineNumber>
  </PriceAvailabilityList>
</priceResponse>
```

**Response Elements:**

| Element                    | Description                              |
| -------------------------- | ---------------------------------------- |
| `synnexSKU`                | TD SYNNEX internal SKU number            |
| `mfgPN`                    | Manufacturer part number                 |
| `mfgCode`                  | Manufacturer code (internal)             |
| `status`                   | Product status: `Active`, `Discontinued`, `Not found` |
| `description`              | Product description                      |
| `GlobalProductStatusCode`  | Global product status                    |
| `price`                    | Your reseller price (USD)                |
| `totalQuantity`            | Total available quantity across all warehouses |
| `AvailabilityByWarehouse`  | Per-warehouse availability breakdown     |
| `warehouseInfo.number`     | Warehouse ID number                      |
| `warehouseInfo.city`       | Warehouse city/location                  |
| `qty`                      | Available quantity at this warehouse      |
| `lineNumber`               | Corresponds to request line number        |

### Querying by Manufacturer Part Number

You can query by manufacturer part number instead of TD SYNNEX SKU:

```bash
curl -X POST 'https://ec.us.tdsynnex.com/SynnexXML/PriceAvailability' \
  -H 'Content-Type: application/xml' \
  -d '<?xml version="1.0" encoding="UTF-8" ?>
<priceRequest>
  <customerNo>YOUR_ACCOUNT_NUMBER</customerNo>
  <userName>YOUR_EC_USERNAME</userName>
  <password>YOUR_EC_PASSWORD</password>
  <skuList>
    <mfgPN>02-SSC-2825</mfgPN>
    <lineNumber>1</lineNumber>
  </skuList>
  <skuList>
    <mfgPN>02-SSC-6848</mfgPN>
    <lineNumber>2</lineNumber>
  </skuList>
</priceRequest>'
```

**Notes:**
- If a product is not found, the response returns `<status>Not found</status>` with `<synnexSKU>0</synnexSKU>`
- Multiple products can be queried in a single request by adding multiple `<skuList>` entries
- The `price` returned is your account-specific reseller price, not MSRP
- Warehouse `98` with city `MFG Drop Shipped` indicates vendor direct ship items

### XML API Environment Configuration

| Environment | Base URL                           |
| ----------- | ---------------------------------- |
| US Prod     | `https://ec.us.tdsynnex.com`      |
| US Sandbox  | `https://testec.us.tdsynnex.com`  |
| CA Prod     | `https://ec.ca.tdsynnex.com`      |
| CA Sandbox  | `https://testec.ca.tdsynnex.com`  |

PNA endpoint path: `/SynnexXML/PriceAvailability`

---

## SOAP Web Services

TD SYNNEX also provides SOAP/WSDL web services for more advanced integrations. These require separate registration via `helpdeskus@tdsynnex.com`.

| Service          | WSDL URL                                              |
| ---------------- | ----------------------------------------------------- |
| Price & Availability | `https://ws.synnex.com/webservice/pnaserviceV05?wsdl` |
| Purchase Order   | `https://ws.synnex.com/webservice/poserviceV02?wsdl`  |
| PO Status        | `https://ws.synnex.com/webservice/posserviceV02?wsdl` |

Documentation: https://www.tdsynnex.com/na/esolutions/

---

## Warehouse Reference

TD SYNNEX US warehouse locations (for interpreting `AvailabilityByWarehouse` responses):

| Warehouse ID | Code | Location              |
| ------------ | ---- | --------------------- |
| 12           | DON  | Chino, CA             |
| 506          | DFO  | Fontana, CA           |
| 3            | DFR  | Tracy, CA             |
| 16           | DFL  | Miami, FL             |
| 502          | DGA  | Suwanee, GA           |
| 6            | DCH  | Romeoville, IL        |
| 504          | DIN  | South Bend, IN        |
| 7            | DTN  | Southaven, MS         |
| 503          | DSW  | Swedesboro, NJ        |
| 50           | DCO  | Columbus, OH          |
| 505          | DFW  | Fort Worth, TX        |
| 98           | DDS  | Vendor Direct Ship    |
| 6523         | SS   | Irvine, CA (Virtual)  |
