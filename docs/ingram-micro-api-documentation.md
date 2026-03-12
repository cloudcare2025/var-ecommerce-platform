# Ingram Micro Reseller API v6 Documentation

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Required Headers](#required-headers)
- [API Endpoints](#api-endpoints)
  - [Product Catalog](#product-catalog)
  - [Orders](#orders)
  - [Quotes](#quotes)
  - [Invoices](#invoices)
  - [Renewals](#renewals)
  - [Deals](#deals)
  - [Returns](#returns)
  - [Freight Estimate](#freight-estimate)
  - [Webhooks](#webhooks)
- [Rate Limits](#rate-limits)
- [HTTP Status Codes](#http-status-codes)
- [Integration Notes](#integration-notes)

---

## Overview

| Property         | Value                                                        |
| ---------------- | ------------------------------------------------------------ |
| API Name         | Ingram Micro Reseller API v6                                 |
| Developer Portal | https://developer.ingrammicro.com/reseller                   |
| API Type         | REST (JSON)                                                  |
| Base URL (Prod)  | `https://api.ingrammicro.com:443`                            |
| Base URL (Sandbox)| `https://api.ingrammicro.com:443/sandbox`                   |
| OAuth Token URL  | `https://api.ingrammicro.com:443/oauth/oauth20/token`        |
| Token Lifetime   | 24 hours (must be refreshed daily)                           |
| API Versions     | v6/v6.1 (current), v7 (async orders), v5 (deprecated), v4 (legacy) |
| Total Endpoints  | 47 (across all versions); 26 in v6/v6.1/v7                  |

The Ingram Micro Reseller API provides eCommerce solutions for product catalog searches, order management, quoting, invoicing, renewals, deals, returns, and freight estimation. All APIs use OAuth 2.0 Bearer tokens for authentication.

---

## Authentication

Ingram Micro uses **OAuth 2.0 Client Credentials** flow.

### Token Request

```
POST https://api.ingrammicro.com:443/oauth/oauth20/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&client_id={CLIENT_ID}&client_secret={CLIENT_SECRET}
```

### Token Response

```json
{
  "access_token": "eyJz933asdfjdhk41aUWw",
  "token_type": "Bearer",
  "expires_in": 2592000
}
```

> **Important:** The access token expires every 24 hours and must be refreshed. Request a new token using the same method above.

### Using the Token

Pass the access token as a Bearer Token in the `Authorization` header:

```
Authorization: Bearer {access_token}
```

---

## Required Headers

Every API request **must** include the following headers:

| Header              | Required | Description                                                                 |
| ------------------- | -------- | --------------------------------------------------------------------------- |
| `Content-Type`      | Yes      | `application/json`                                                          |
| `Accept`            | Yes      | `application/json`                                                          |
| `Authorization`     | Yes      | `Bearer {access_token}`                                                     |
| `IM-CustomerNumber` | Yes      | Your Ingram Micro reseller account number (e.g., `20-222222`)               |
| `IM-CountryCode`    | Yes      | Two-letter ISO country code (e.g., `US`)                                    |
| `IM-CorrelationID`  | Yes      | Unique UUID for request tracing (e.g., `fbac82ba-cf0a-4bcf-fc03-0c508457`) |
| `IM-SenderID`       | No*      | Application identifier string (e.g., `MyApp-CompanyName`)                   |
| `IM-CustomerContact`| Some     | Required for Quote Search, Returns Create, Freight Estimate                 |
| `IM-ApplicationID`  | Some     | Required for Invoice Search and Invoice Details v6.1                        |

> **Note:** The customer number in the API call must match the registered customer number on the app, or you will receive an "Invalid customer number" error.

### Example Request Headers

```
Content-Type: application/json
Accept: application/json
Authorization: Bearer {access-token}
IM-CustomerNumber: 20-222222
IM-CorrelationID: fbac82ba-cf0a-4bcf-fc03-0c508457f219
IM-CountryCode: US
IM-SenderID: MyApp-CompanyName
```

---

## API Endpoints

### Product Catalog

#### POST `/resellers/v6/catalog/priceandavailability` — Price and Availability

Look up real-time price and availability for up to **50 SKUs** at once.

**Query Parameters:**

| Parameter            | Type    | Required | Description                        |
| -------------------- | ------- | -------- | ---------------------------------- |
| `includeAvailability`| boolean | Yes      | Include stock availability data    |
| `includePricing`     | boolean | Yes      | Include pricing data               |

**Request Body:**

```json
{
  "products": [
    { "ingramPartNumber": "01RW10" },
    { "vendorPartNumber": "65324819CA" },
    {
      "vendorPartNumber": "65324819CA",
      "planID": "459468",
      "resourceId": "xxxxxx"
    }
  ]
}
```

**Response (200):**

```json
[
  {
    "productStatusMessage": "ACOPS ARE AVAILABLE FOR THIS CUSTOMER AND SKU",
    "ingramPartNumber": "4A0036",
    "vendorPartNumber": "E2016HV",
    "extendedVendorPartNumber": "E2016HV",
    "upc": "0884116186519",
    "vendorNumber": "802U",
    "vendorName": "DELL",
    "description": "20IN MONITOR E2016HV 210-AGLU MNTR",
    "productClass": "B",
    "uom": "EA",
    "acceptBackOrder": true,
    "productAuthorized": true,
    "returnableProduct": true,
    "endUserInfoRequired": false,
    "govtSpecialPriceAvailable": true,
    "availability": {
      "available": false,
      "totalAvailability": 0,
      "availabilityByWarehouse": [
        {
          "warehouseId": 20,
          "location": "Fort Worth, TX",
          "quantityAvailable": 0,
          "quantityBackordered": 0,
          "backOrderInfo": [
            { "quantity": 1437, "etaDate": "2025-01-01" }
          ]
        }
      ]
    },
    "pricing": {
      "mapPrice": 0,
      "currencyCode": "USD",
      "retailPrice": 149.99,
      "customerPrice": 100.45
    }
  }
]
```

**Response Codes:** 200, 207 (partial success), 400, 401, 500

---

#### GET `/resellers/v6/catalog` — Search Products

Search the product catalog by keyword, vendor, category, or part number.

**Query Parameters:**

| Parameter          | Type       | Required | Description                                |
| ------------------ | ---------- | -------- | ------------------------------------------ |
| `pageNumber`       | integer    | No       | Page number for pagination                 |
| `pageSize`         | integer    | No       | Results per page                           |
| `type`             | string     | No       | Product type filter                        |
| `hasDiscounts`     | string     | No       | Filter by discount availability            |
| `vendor`           | string[]   | No       | Filter by vendor name(s)                   |
| `vendorPartNumber` | string[]   | No       | Filter by vendor part number(s)            |
| `vendorNumber`     | string     | No       | Filter by vendor number                    |
| `keyword`          | string[]   | No       | Search keywords                            |
| `category`         | string     | No       | Product category                           |
| `skipAuthorisation`| string     | No       | Skip authorization check                   |
| `groupName`        | string     | No       | Cloud/subscription group name              |
| `planName`         | string     | No       | Cloud/subscription plan name               |
| `planId`           | string     | No       | Cloud/subscription plan ID                 |
| `showGroupInfo`    | boolean    | No       | Include group information                  |

**Additional Header:** `Accept-Language` (optional) — for localized results.

**Response Codes:** 200, 400, 404, 500

---

#### GET `/resellers/v6/catalog/details/{ingramPartNumber}` — Product Details

Get detailed product information by Ingram part number.

**Path Parameters:**

| Parameter          | Type   | Required | Description                |
| ------------------ | ------ | -------- | -------------------------- |
| `ingramPartNumber` | string | Yes      | Ingram Micro part number   |

**Query Parameters:**

| Parameter          | Type   | Required | Description                |
| ------------------ | ------ | -------- | -------------------------- |
| `vendorPartNumber` | string | No       | Vendor part number         |
| `planName`         | string | No       | Cloud/subscription plan    |
| `planId`           | string | No       | Cloud/subscription plan ID |

**Response Codes:** 200, 400, 404, 500

---

### Orders

#### POST `/resellers/v6/orders` — Create Order (Synchronous)

Create and place a new order. Supports standard products and direct-ship products including licensing and warranty SKUs.

**Request Body:**

```json
{
  "customerOrderNumber": "SWAGGER-01",
  "notes": "This is the field for comments",
  "lines": [
    {
      "customerLineNumber": "1",
      "ingramPartNumber": "DF4128",
      "quantity": 1
    }
  ],
  "additionalAttributes": [
    {
      "attributeName": "allowDuplicateCustomerOrderNumber",
      "attributeValue": "true"
    }
  ]
}
```

**Response (201):**

```json
{
  "customerOrderNumber": "SWAGGER-01",
  "billToAddressId": "000",
  "orderSplit": false,
  "processedPartially": false,
  "purchaseOrderTotal": 14.29,
  "shipToInfo": {
    "addressId": "200",
    "companyName": "INGRAM MICRO TEST ACCOUNT",
    "addressLine1": "ATTN TOD DEBIE",
    "addressLine2": "1610 E SAINT ANDREW PL",
    "city": "SANTA ANA",
    "state": "CA",
    "postalCode": "927054931",
    "countryCode": "US"
  },
  "orders": [
    {
      "numberOfLinesWithSuccess": 1,
      "numberOfLinesWithError": 0,
      "ingramOrderNumber": "20-RFKW4",
      "ingramOrderDate": "2021-05-26",
      "orderType": "S",
      "orderTotal": 14.29,
      "freightCharges": 14.29,
      "totalTax": 0,
      "currencyCode": "USD",
      "lines": [
        {
          "subOrderNumber": "20-RFKW4-11",
          "ingramLineNumber": "001",
          "customerLineNumber": "1",
          "lineStatus": "Backordered",
          "ingramPartNumber": "DF4128",
          "unitPrice": 61.22,
          "quantityOrdered": 1,
          "quantityConfirmed": 0,
          "quantityBackOrdered": 1,
          "shipmentDetails": {
            "carrierCode": "O1",
            "carrierName": "ONTRAC",
            "shipFromWarehouseId": "10",
            "shipFromLocation": "Mira Loma, CA"
          }
        }
      ]
    }
  ]
}
```

**Response Codes:** 201, 207 (partial), 400, 500

---

#### POST `/resellers/v7/orders` — Create Order (Asynchronous)

Submit an order asynchronously. Supports all v6 features plus enhanced vendor-managed fulfillment (VMF) attributes.

**Request Body (v7 — full schema):**

```json
{
  "quoteNumber": "string",
  "customerOrderNumber": "string",
  "endCustomerOrderNumber": "string",
  "notes": "string",
  "billToAddressId": "string",
  "specialBidNumber": "string",
  "acceptBackOrder": "true",
  "vendAuthNumber": "string",
  "resellerInfo": {
    "resellerId": "string",
    "companyName": "string",
    "contact": "string",
    "addressLine1": "string",
    "city": "string",
    "state": "string",
    "postalCode": "string",
    "countryCode": "string",
    "phoneNumber": 0,
    "email": "string"
  },
  "endUserInfo": {
    "endUserId": "string",
    "contact": "string",
    "companyName": "string",
    "addressLine1": "string",
    "city": "string",
    "state": "str",
    "postalCode": "string",
    "countryCode": "string",
    "phoneNumber": 0,
    "email": "string"
  },
  "shipToInfo": {
    "addressId": "string",
    "contact": "string",
    "companyName": "string",
    "addressLine1": "string",
    "city": "string",
    "state": "str",
    "postalCode": "string",
    "countryCode": "string",
    "email": "string",
    "shippingNotes": "string",
    "phoneNumber": "string"
  },
  "shipmentDetails": {
    "carrierCode": "st",
    "requestedDeliveryDate": "string",
    "shipComplete": "s",
    "shippingInstructions": "string",
    "freightAccountNumber": "string",
    "signatureRequired": true
  },
  "additionalAttributes": [
    { "attributeName": "string", "attributeValue": "string" }
  ],
  "vmfAdditionalAttributes": [
    { "attributeName": "string", "attributeValue": "string" }
  ],
  "lines": [
    {
      "customerLineNumber": "string",
      "ingramPartNumber": "string",
      "quantity": 0
    }
  ]
}
```

**Response (200):**

```json
{
  "quoteNumber": "",
  "confirmationNumber": "US-I-T-24032926562341102332",
  "message": "Thank you for submitting the order request, it's currently under process. We will notify you of the status via the Order Status webhook."
}
```

**Response Codes:** 200, 201, 400, 500

---

#### PUT `/resellers/v6/orders/{orderNumber}` — Modify Order

Add, update, or delete lines on an existing order.

**Path Parameters:**

| Parameter     | Type   | Required | Description            |
| ------------- | ------ | -------- | ---------------------- |
| `orderNumber` | string | Yes      | Ingram Micro order no. |

**Query Parameters:**

| Parameter    | Type   | Required | Description       |
| ------------ | ------ | -------- | ----------------- |
| `actionCode` | string | No       | Modification type |

**Request Body:**

```json
{
  "lines": [
    {
      "customerLineNumber": "002",
      "ingramPartNumber": "2GZ200",
      "addUpdateDeleteLine": "ADD",
      "quantity": 2
    }
  ]
}
```

**Response (200):**

```json
{
  "ingramOrderNumber": "30-B3PF2",
  "orderModifiedDate": "2021-02-20T15:05:19.515+05:30",
  "customerOrderNumber": "MIGRATION_30172001",
  "orderTotal": 3801.32,
  "orderStatus": "im::hold",
  "lines": [
    {
      "subOrderNumber": "30-B3PF2-11",
      "lineNumber": "005",
      "ingramPartNumber": "2GZ200",
      "vendorPartNumber": "SIP-T46S",
      "quantityOrdered": 5,
      "quantityConfirmed": 5
    }
  ],
  "rejectedLineItems": [
    {
      "customerLineNumber": "006",
      "ingramPartNumber": "2GZ2000001",
      "rejectCode": "EN",
      "rejectReason": "ERROR-PART-NOT-FOUND"
    }
  ]
}
```

**Response Codes:** 200, 201, 207, 400, 401, 404, 500

---

#### GET `/resellers/v6.1/orders/{ordernumber}` — Get Order Details (v6.1)

Retrieve detailed order information including line items, shipment tracking, and status.

**Path Parameters:**

| Parameter     | Type   | Required | Description               |
| ------------- | ------ | -------- | ------------------------- |
| `ordernumber` | string | Yes      | Ingram Micro order number |

**Query Parameters:**

| Parameter         | Type   | Required | Description                |
| ----------------- | ------ | -------- | -------------------------- |
| `ingramOrderDate` | date   | No       | Filter by order date       |

**Response Codes:** 200, 500

---

#### GET `/resellers/v6/orders/{ordernumber}` — Get Order Details (v6)

Retrieve order details with additional filtering options.

**Path Parameters:**

| Parameter     | Type   | Required | Description               |
| ------------- | ------ | -------- | ------------------------- |
| `ordernumber` | string | Yes      | Ingram Micro order number |

**Query Parameters:**

| Parameter         | Type    | Required | Description                   |
| ----------------- | ------- | -------- | ----------------------------- |
| `ingramOrderDate` | date    | No       | Filter by order date          |
| `vendorNumber`    | string  | No       | Filter by vendor              |
| `simulateStatus`  | string  | No       | Simulate order status (test)  |
| `isIml`           | boolean | No       | Is IML order                  |
| `regionCode`      | string  | No       | Region code filter            |

**Response Codes:** 200, 204, 400, 500

---

#### GET `/resellers/v6/orders/search` — Search Orders

Search existing orders by various criteria.

**Query Parameters:**

| Parameter                | Type     | Required | Description                              |
| ------------------------ | -------- | -------- | ---------------------------------------- |
| `ingramOrderNumber`     | string   | No       | Ingram Micro sales order number          |
| `orderStatus`           | string   | No       | Single status filter                     |
| `orderStatus-in`        | string[] | No       | Multiple status filter                   |
| `ingramOrderDate`       | string   | No       | Exact order date                         |
| `ingramOrderDate-bt`    | string[] | No       | Order date range (between)               |
| `customerOrderNumber`   | string   | No       | Your PO number                           |
| `endCustomerOrderNumber`| string   | No       | End customer PO                          |
| `pageSize`              | integer  | No       | Results per page                         |
| `pageNumber`            | integer  | No       | Page number                              |
| `invoiceDate_bt`        | string[] | No       | Invoice date range                       |
| `shipDate_bt`           | string[] | No       | Ship date range                          |
| `deliveryDate_bt`       | string[] | No       | Delivery date range                      |
| `ingramPartNumber`      | string   | No       | Filter by Ingram part number             |
| `vendorPartNumber`      | string   | No       | Filter by vendor part number             |
| `serialNumber`          | string   | No       | Filter by serial number                  |
| `trackingNumber`        | string   | No       | Filter by tracking number                |
| `vendorName`            | string   | No       | Filter by vendor name                    |
| `specialBidNumber`      | string   | No       | Filter by special bid number             |

**Response Codes:** 200, 204, 400, 500

---

#### DELETE `/resellers/v6/orders/{OrderNumber}` — Cancel Order

Cancel an order (subject to order status restrictions).

**Path Parameters:**

| Parameter     | Type   | Required | Description               |
| ------------- | ------ | -------- | ------------------------- |
| `OrderNumber` | string | Yes      | Ingram Micro order number |

**Response Codes:** 200, 400, 404, 405, 500

---

#### POST `/resellers/v7/vendorrequiredinfo` — Vendor Required Info

Retrieve vendor-required additional attributes for placing VMF orders.

**Request Body:**

```json
{
  "quoteNumber": "QUO-14551943-D2Y9L9",
  "products": [
    {
      "ingramPartNumber": "string",
      "vendorPartNumber": "string",
      "planID": 0
    }
  ]
}
```

**Response (200):**

```json
[
  {
    "ingramPartNumber": "5DV320",
    "vmfAdditionalAttributes": [
      {
        "vendorName": "OMNISSA WS1",
        "additionalAttributes": [
          {
            "attributeName": "HEADER_ENDUSER",
            "attributeDescription": "HeaderEndUser",
            "choices": []
          }
        ]
      }
    ]
  }
]
```

**Response Codes:** 200

---

### Quotes

#### POST `/resellers/v6/quotes/create` — Create Quote

Create a new quote (processed asynchronously).

**Request Body:**

```json
{
  "quoteName": "QuoteTest",
  "quoteExpiryDate": "04/30/2024",
  "customerNeed": "notes",
  "firstName": "User1",
  "lastName": "User name",
  "pricingType": "",
  "customercontact": "user@example.com",
  "dealId": "7499800",
  "endUserInfo": {
    "companyName": "Acme Corp",
    "contact": "Test contact",
    "addressLine1": "123 Main Street",
    "city": "Santa Ana",
    "state": "CA",
    "postalCode": "92705",
    "countryCode": "US",
    "email": "testcontact@example.com",
    "phoneNumber": "5551234567"
  },
  "products": []
}
```

**Response (200):**

```json
{
  "quoteNumber": "QUO-2081293-G9X1K5",
  "message": "Thank you for submitting the quote request, it's currently under process. We will notify you of the status via the Quote Status webhook."
}
```

**Response Codes:** 200

---

#### GET `/resellers/v6/quotes/search` — Search Quotes

Search for quotes by various criteria. By default retrieves quotes modified/created within the last 30 days.

**Additional Required Header:** `IM-CustomerContact` (string)

**Query Parameters:**

| Parameter           | Type    | Required | Description                          |
| ------------------- | ------- | -------- | ------------------------------------ |
| `quoteNumber`       | string  | No       | Quote number                         |
| `specialBidNumber`  | string  | No       | Special bid number                   |
| `endUserContact`    | string  | No       | End user contact                     |
| `sortingOrder`      | string  | No       | Sort direction (ASC/DESC)            |
| `sortBy`            | string  | No       | Sort field                           |
| `pageSize`          | integer | No       | Results per page                     |
| `pageNumber`        | integer | No       | Page number                          |
| `vendorName`        | string  | No       | Vendor name filter                   |
| `quoteName`         | string  | No       | Quote name filter                    |
| `status`            | string  | No       | Quote status filter                  |
| `quoteCreateDate-bt`| string  | No       | Date range filter                    |

> **Note:** Only active quotes are returned. Quotes older than 365 days, and draft/closed quotes are excluded.

**Response Codes:** 200, 400, 401, 404, 500

---

#### GET `/resellers/v6/quotes/{quoteNumber}` — Get Quote Details

Retrieve detailed information for a specific quote.

**Path Parameters:**

| Parameter     | Type   | Required | Description   |
| ------------- | ------ | -------- | ------------- |
| `quoteNumber` | string | Yes      | Quote number  |

**Response Codes:** 200, 400, 500

---

### Invoices

#### GET `/resellers/v6/invoices/` — Search Invoices

Search invoices with extensive filtering. Invoice information is available for orders placed in the last 2 years.

**Additional Required Header:** `IM-ApplicationID` (string)

**Query Parameters:**

| Parameter                | Type    | Required | Description                       |
| ------------------------ | ------- | -------- | --------------------------------- |
| `paymentTermsNetDate`    | string  | No       | Payment terms net date            |
| `invoiceDate`            | string  | No       | Invoice date                      |
| `invoiceDueDate`         | string  | No       | Invoice due date                  |
| `orderDate`              | string  | No       | Order date                        |
| `orderFromDate`          | string  | No       | Order date range start            |
| `orderToDate`            | string  | No       | Order date range end              |
| `orderNumber`            | string  | No       | Ingram order number               |
| `DeliveryNumber`         | string  | No       | Delivery number                   |
| `invoiceNumber`          | string  | No       | Invoice number                    |
| `invoiceStatus`          | string  | No       | Invoice status                    |
| `invoiceType`            | string  | No       | Invoice type                      |
| `customerOrderNumber`    | string  | No       | Your PO number                    |
| `endCustomerOrderNumber` | string  | No       | End customer PO                   |
| `specialBidNumber`       | string  | No       | Special bid number                |
| `invoiceFromDueDate`     | string  | No       | Due date range start              |
| `invoiceToDueDate`       | string  | No       | Due date range end                |
| `invoiceFromDate`        | string  | No       | Invoice date range start          |
| `invoiceToDate`          | string  | No       | Invoice date range end            |
| `pageSize`               | integer | No       | Results per page                  |
| `pageNumber`             | integer | No       | Page number                       |
| `orderby`                | string  | No       | Sort field                        |
| `direction`              | string  | No       | Sort direction                    |
| `serialNumber`           | string  | No       | Serial number filter              |

**Response Codes:** 200, 400, 500

---

#### GET `/resellers/v6.1/invoices/{invoiceNumber}` — Get Invoice Details (v6.1)

Retrieve detailed invoice information.

**Additional Required Header:** `IM-ApplicationID` (string)

**Path Parameters:**

| Parameter       | Type   | Required | Description    |
| --------------- | ------ | -------- | -------------- |
| `invoiceNumber` | string | Yes      | Invoice number |

**Query Parameters:**

| Parameter              | Type    | Required | Description              |
| ---------------------- | ------- | -------- | ------------------------ |
| `customerType`         | string  | No       | Customer type filter     |
| `includeSerialNumbers` | boolean | No       | Include serial numbers   |

**Response Codes:** 200, 400, 500

---

#### GET `/resellers/v6/invoices/{invoicenumber}` — Get Invoice Details (v6)

Retrieve invoice details (v6 version).

**Additional Required Headers:** `IM-ApplicationID` (string), `version` (string)

**Path Parameters:**

| Parameter       | Type   | Required | Description    |
| --------------- | ------ | -------- | -------------- |
| `invoicenumber` | string | Yes      | Invoice number |

**Query Parameters:**

| Parameter              | Type    | Required | Description              |
| ---------------------- | ------- | -------- | ------------------------ |
| `customerType`         | string  | No       | Customer type filter     |
| `includeSerialNumbers` | boolean | No       | Include serial numbers   |

**Response Codes:** 200, 400, 500

---

### Renewals

#### POST `/resellers/v6/renewals/search` — Search Renewals

Search for renewals with filtering by status, date ranges, vendor, and end user.

**Query Parameters:**

| Parameter                    | Type   | Required | Description                  |
| ---------------------------- | ------ | -------- | ---------------------------- |
| `customerOrderNumber`        | string | No       | Customer PO number           |
| `ingramPurchaseOrderNumber`  | string | No       | Ingram PO number             |
| `serialNumber`               | string | No       | Serial number                |
| `page`                       | string | No       | Page number                  |
| `size`                       | string | No       | Page size                    |
| `sort`                       | string | No       | Sort criteria                |

**Request Body:**

```json
[
  {
    "status": {
      "OpporutinyStatus": {
        "value": "Closed",
        "subStatus": "Renewal went direct"
      }
    },
    "dateType": {
      "startDate": { "customStartDate": "05/27/2023", "customEndDate": "06/26/2023" },
      "endDate": { "customStartDate": "06/26/2023", "customEndDate": "07/26/2023" },
      "invoiceDate": { "customStartDate": "05/27/2023", "customEndDate": "06/26/2023" },
      "expirationDate": { "customStartDate": "06/26/2023", "customEndDate": "07/26/2023" }
    },
    "vendor": "HP",
    "endUser": "STARK"
  }
]
```

**Response (200):**

```json
[
  {
    "recordsFound": 114,
    "pageSize": 25,
    "pageNumber": 1,
    "renewals": [
      {
        "renewalId": 4239056,
        "customerOrderNumber": "MyPONumber",
        "endUser": "ABC TECHNOLOGIES",
        "vendor": "HP",
        "expirationDate": "2023-07-04T00:00:00",
        "renewalValue": 381.5,
        "status": "Quote pending",
        "links": [
          { "topic": "renewals", "href": "/resellers/v6/renewals/4419005", "type": "Get" },
          { "topic": "quotedetails", "href": "/resellers/v6/quotes/QUO-15850886-M6H4V9", "type": "Get" }
        ]
      }
    ],
    "nextPage": "/resellers/v6/renewals/search?page=2"
  }
]
```

**Response Codes:** 200, 400, 500

---

#### GET `/resellers/v6/renewals/{renewalId}` — Get Renewal Details

Retrieve detailed information for a specific renewal.

**Path Parameters:**

| Parameter   | Type   | Required | Description |
| ----------- | ------ | -------- | ----------- |
| `renewalId` | string | Yes      | Renewal ID  |

**Response Codes:** 200, 400, 500

---

### Deals

#### GET `/resellers/v6/deals/search` — Search Deals

Search for deals by end user, vendor, or deal ID.

**Query Parameters:**

| Parameter | Type   | Required | Description      |
| --------- | ------ | -------- | ---------------- |
| `endUser` | string | No       | End user name    |
| `vendor`  | string | No       | Vendor name      |
| `dealId`  | string | No       | Deal ID          |

**Response Codes:** 200, 400, 500

---

#### GET `/resellers/v6/deals/{dealId}` — Get Deal Details

Retrieve detailed information for a specific deal.

**Path Parameters:**

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| `dealId`  | string | Yes      | Deal ID     |

**Query Parameters:**

| Parameter    | Type   | Required | Description |
| ------------ | ------ | -------- | ----------- |
| `vendorName` | string | Yes      | Vendor name |

**Response Codes:** 200, 400, 500

---

### Returns

#### GET `/resellers/v6/returns/search` — Search Returns

Search for return cases with extensive filtering.

**Query Parameters:**

| Parameter          | Type   | Required | Description                   |
| ------------------ | ------ | -------- | ----------------------------- |
| `caseRequestNumber`| string | No       | Case/request number           |
| `invoiceNumber`    | string | No       | Invoice number                |
| `returnClaimId`    | string | No       | Return claim ID               |
| `referenceNumber`  | string | No       | Reference number              |
| `ingramPartNumber` | string | No       | Ingram part number            |
| `vendorPartNumber` | string | No       | Vendor part number            |
| `returnStatus-in`  | string | No       | Return status filter          |
| `claimStatus-in`   | string | No       | Claim status filter           |
| `createdOn-bt`     | string | No       | Created date range            |
| `modifiedOn-bt`    | string | No       | Modified date range           |
| `returnReason-in`  | string | No       | Return reason filter          |
| `page`             | string | No       | Page number                   |
| `size`             | string | No       | Page size                     |
| `sort`             | string | No       | Sort criteria                 |
| `sortingColumnName`| string | No       | Sort column                   |

**Response Codes:** 200, 400, 500

---

#### GET `/resellers/v6/returns/{caseRequestNumber}` — Get Return Details

Retrieve detailed return/claim information.

**Path Parameters:**

| Parameter           | Type   | Required | Description          |
| ------------------- | ------ | -------- | -------------------- |
| `caseRequestNumber` | string | Yes      | Case/request number  |

**Response Codes:** 200, 400, 500

---

#### POST `/resellers/v6/returns/create` — Create Return

Create a new return request.

**Additional Required Header:** `IM-CustomerContact` (string)

**Request Body:**

```json
{
  "list": [
    {
      "invoiceNumber": "40-NFERG-11",
      "invoiceDate": "2023-07-18",
      "customerOrderNumber": "",
      "ingramPartNumber": "164B2G",
      "vendorPartNumber": "",
      "serialNumber": "",
      "quantity": "1",
      "primaryReason": "I have not received part or all of my order",
      "secondaryReason": "Received only partial shipment.",
      "notes": "B2BCartCreation20",
      "referenceNumber": "RefNum",
      "billToAddressId": "000",
      "shipFromInfo": {
        "companyName": "ABC TECH",
        "contact": "STARK",
        "addressLine1": "17501 W 98TH ST SPC 1833",
        "city": "LENEXA",
        "state": "KS",
        "postalCode": "662191736",
        "countryCode": "US",
        "email": "contact@example.com",
        "phoneNumber": ""
      },
      "numberOfBoxes": "1"
    }
  ]
}
```

**Response (200):**

```json
{
  "returnsClaims": [
    {
      "rmaClaimId": "",
      "caseRequestNumber": "CAS-08946-G1W3J3-1",
      "referenceNumber": "B2BTest-US",
      "createdOn": "2023-07-31T07:00:00Z",
      "type": "CLAIM",
      "returnReason": "(SS) Short Shipment",
      "ingramPartNumber": "YZ3606",
      "quantity": 1,
      "estimatedTotalValue": 4165,
      "status": "Open",
      "links": [
        { "topic": "returnsClaimsDetails", "href": "/resellers/v6/returns/CAS-08946-G1W3J3-1", "type": "get" }
      ]
    }
  ]
}
```

**Response Codes:** 200, 400, 500

---

### Freight Estimate

#### POST `/resellers/v6/freightestimate` — Estimate Freight

Estimate freight charges for an order before placing it.

**Additional Required Header:** `IM-CustomerContact` (string)

**Request Body:**

```json
{
  "billToAddressId": "000",
  "shipToAddressId": "200",
  "shipToAddress": {
    "companyName": "ABC TECH",
    "addressLine1": "17501 W 98TH ST SPC 1833",
    "city": "LENEXA",
    "state": "KS",
    "postalCode": "662191736",
    "countryCode": "US"
  },
  "lines": [
    {
      "customerLineNumber": "001",
      "ingramPartNumber": "A300-123456",
      "quantity": "1",
      "warehouseId": "20",
      "carrierCode": ""
    }
  ]
}
```

**Response (200):**

```json
{
  "freightEstimateResponse": {
    "currencyCode": "USD",
    "totalFreightAmount": 58.64,
    "totalTaxAmount": 0,
    "totalFees": 0,
    "grossAmount": 418.17,
    "distribution": [
      {
        "shipFromBranchNumber": "10",
        "carrierCode": "RG",
        "shipVia": "FEDEX GROUND",
        "freightRate": 19.7,
        "totalWeight": 13,
        "transitDays": 1,
        "carrierList": [
          {
            "carrierCode": "RG",
            "shipVia": "FEDEX GROUND",
            "carrierMode": "SML",
            "estimatedFreightCharge": "19.7",
            "daysInTransit": "1"
          },
          {
            "carrierCode": "UG",
            "shipVia": "UPS GROUND",
            "carrierMode": "SML",
            "estimatedFreightCharge": "23.8",
            "daysInTransit": "1"
          }
        ]
      }
    ]
  }
}
```

**Response Codes:** 200, 400, 500

---

### Webhooks

Ingram Micro supports webhooks for real-time event notifications. Create webhooks via the [Webhooks page](https://developer.ingrammicro.com/reseller/webhooks) on the developer portal.

#### POST `/resellers/v1/webhooks/orderstatusevent` — Order Status Webhook

Subscribe to real-time order status change events. Supports multiple event types under a single webhook or individual webhooks per event.

**Base URL:** `https://api.ingrammicro.com:443/resellers/v1`

---

#### POST `/resellers/v1/webhooks/availabilityupdate` — Stock Update Webhook

Subscribe to inventory/stock quantity updates for authorized SKUs. Triggers at configured intervals with updated quantities.

**Base URL:** `https://api.ingrammicro.com:443/resellers/v1`

---

#### POST `/resellers/v1/webhooks/QuoteCreate` — Quote Create Webhook

Subscribe to quote creation events. Triggers for quotes created via Xvantage platform, APIs, associates, etc.

---

## Rate Limits

Rate limits are enforced **per API app** to protect service stability.

| Limit Type       | Value                          |
| ---------------- | ------------------------------ |
| GET calls        | **60 calls per minute** per endpoint |
| Total per app    | 500 requests per window        |
| Exceeded status  | `429 Too Many Requests`        |

### Rate Limit Response Headers

| Header                  | Description                                                    |
| ----------------------- | -------------------------------------------------------------- |
| `X-RateLimit-Limit`     | Total rate limit available per app per transaction (e.g., 500) |
| `X-RateLimit-Remaining` | Remaining requests in the current window                       |
| `X-RateLimit-Reset`     | Unix epoch timestamp when the counter resets                   |

### Rate Limit Exceeded Response

```json
{
  "errors": [
    {
      "field": null,
      "message": "too many requests"
    }
  ]
}
```

---

## HTTP Status Codes

| Code | Description                                         |
| ---- | --------------------------------------------------- |
| 200  | OK — Request successful                             |
| 201  | Created — Resource created successfully (orders)    |
| 204  | No Content — Request successful, no data returned   |
| 207  | Multi-Status — Partial success (some lines failed)  |
| 400  | Bad Request — Invalid parameters or request body    |
| 401  | Unauthorized — Invalid or expired token             |
| 404  | Not Found — Resource does not exist                 |
| 405  | Method Not Allowed — Cannot perform action on order |
| 429  | Too Many Requests — Rate limit exceeded             |
| 500  | Internal Server Error — Server-side failure         |

---

## Integration Notes

### Warehouse IDs

Ingram Micro fulfills from multiple US warehouses. Common warehouse IDs returned in availability/shipment responses:

| ID | Location             |
| -- | -------------------- |
| 10 | Mira Loma, CA        |
| 20 | Fort Worth, TX       |
| 40 | Carol Stream, IL     |
| 80 | Jonestown, PA        |

### Carrier Codes

Common carrier codes in shipment/freight responses:

| Code | Carrier              |
| ---- | -------------------- |
| RG   | FedEx Ground         |
| UG   | UPS Ground           |
| O1   | OnTrac               |
| HD   | FedEx Home Delivery  |
| OT   | Other                |

### API Version Migration

- **v6/v6.1** — Current recommended version for all new integrations
- **v7** — Async order creation with enhanced VMF support
- **v5** — Deprecation planned; still functional but should migrate to v6
- **v4** — Legacy; avoid for new development

### Sandbox Environment

- Sandbox base URL: `https://api.ingrammicro.com:443/sandbox`
- Pre-loaded with test data (SKUs, orders, invoices)
- Use sandbox app credentials (separate from production)
- Identical API structure to production

### Key Differences from D&H / TD SYNNEX

| Feature                | Ingram Micro                             | D&H                  | TD SYNNEX             |
| ---------------------- | ---------------------------------------- | --------------------- | --------------------- |
| Token Lifetime         | 24 hours                                 | Varies                | 2 hours               |
| Max SKUs per P&A call  | 50                                       | 50                    | N/A (per-item)        |
| Required Headers       | IM-CustomerNumber, IM-CountryCode, etc.  | dandh-tenant          | x-api-key             |
| Async Orders           | v7 (webhook-based)                       | Not available         | Not available         |
| Webhook Support        | Yes (Order Status, Stock, Quotes)        | No                    | No                    |
| Invoice Retention      | 2 years (v6) / 9 months (v5)            | N/A                   | N/A                   |

### Available API Products (enabled on production app)

- Product Catalog v6
- Order Management v6 / v7 (Async)
- Quote Management v6
- Invoice Management v6 / v6.1
- Deal Management v6
- Freight Estimate v6
- Renewal Management v6
- Return Management v6

### Useful Links

- Developer Portal: https://developer.ingrammicro.com/reseller
- API Documentation: https://developer.ingrammicro.com/reseller/api-documentation/United_States
- Getting Started: https://developer.ingrammicro.com/reseller/getting-started
- FAQs: https://developer.ingrammicro.com/reseller/faq
- Webhooks: https://developer.ingrammicro.com/reseller/webhooks
- SDKs: https://developer.ingrammicro.com/reseller/sdks
- MCP Server: https://developer.ingrammicro.com/reseller/mcp-server
