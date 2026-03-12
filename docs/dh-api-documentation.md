# D&H Customer Order Management API v2.0.1

> Complete API reference for the D&H distributor integration.
> Portal: https://apiportal.dandh.com/

---

## Overview

The Customer Order Management API provides D&H customers an interface to:
- Retrieve **real-time item prices** and **inventory availability**
- Query **product information** (item inquiries)
- **Submit sales orders**
- **Track order status** for previously submitted orders
- Look up **available shipping carriers**

| Property | Value |
|---|---|
| **Base URL** | `https://api.dandh.com/customerOrderManagement/v2` |
| **OAuth Token URL** | `https://auth.dandh.com/api/oauth/token` |
| **Version** | 2.0.1 |
| **Type** | REST (OAS 3.0) |
| **CORS** | Enabled |
| **Tags** | `customerOrderManagement`, `external`, `system_api`, `v2.0.1` |

---

## Authentication

D&H uses **OAuth 2.0 Client Credentials** flow.

### Obtaining an Access Token

```http
POST https://auth.dandh.com/api/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&client_id={API_KEY}&client_secret={API_SECRET}
```

The returned `access_token` is then passed as a Bearer token:

```http
Authorization: Bearer {access_token}
```

### Required Headers (All Requests)

| Header | Required | Description |
|---|---|---|
| `Authorization` | Yes | `Bearer {access_token}` |
| `dandh-tenant` | Yes | The D&H company tenant. Available values: `dhus`, `dhca`, `dsc` |

**Tenant Values:**
- `dhus` — D&H United States
- `dhca` — D&H Canada
- `dsc` — D&H subsidiary (DSC)

---

## Common Path Parameter

All endpoints are scoped to a customer account:

| Parameter | Type | Required | Description |
|---|---|---|---|
| `accountNumber` | string (path) | Yes | The 10-digit customer account number |

---

## API Endpoints

### 1. Get Item Price

Retrieve real-time pricing for a single item.

```http
GET /customers/{accountNumber}/items/{itemId}/price
```

**Parameters:**

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountNumber` | path | string | Yes | 10-digit customer account number |
| `itemId` | path | string | Yes | The D&H item number |
| `quantity` | query | integer | No | Number of units requested for pricing |
| `dandh-tenant` | header | string | Yes | `dhus`, `dhca`, or `dsc` |

**Response (200):**

```json
{
  "itemId": "TI83PLUS",
  "rebate": {
    "amount": "string",
    "endDate": "2026-03-11T21:12:27.908Z"
  },
  "salesPrice": "string",
  "customerItemNumber": "TI84-PLUS-CE"
}
```

**Response Fields:**

| Field | Type | Description |
|---|---|---|
| `itemId` | string | D&H item identifier |
| `salesPrice` | string | Reseller price |
| `customerItemNumber` | string | Customer's own item number mapping |
| `rebate.amount` | string | Rebate amount if applicable |
| `rebate.endDate` | datetime | Rebate expiration date |

---

### 2. Get Item Availability

Retrieve real-time inventory availability for a single item.

```http
GET /customers/{accountNumber}/items/{itemId}/availability
```

**Parameters:**

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountNumber` | path | string | Yes | 10-digit customer account number |
| `itemId` | path | string | Yes | The D&H item number |
| `dandh-tenant` | header | string | Yes | `dhus`, `dhca`, or `dsc` |

**Response (200):**

```json
{
  "itemId": "TI83PLUS",
  "customerItemNumber": "TI84-PLUS-CE",
  "totalAvailableQuantity": 0,
  "branchInventory": [
    {
      "availableQuantity": 0,
      "stockReplenishDate": "2026-03-11T21:12:27.913Z",
      "branch": "BR01"
    }
  ]
}
```

**Response Fields:**

| Field | Type | Description |
|---|---|---|
| `itemId` | string | D&H item identifier |
| `customerItemNumber` | string | Customer's own item mapping |
| `totalAvailableQuantity` | integer | Total quantity available across all branches |
| `branchInventory` | array | Per-branch inventory breakdown |
| `branchInventory[].availableQuantity` | integer | Quantity available at this branch |
| `branchInventory[].stockReplenishDate` | datetime | Expected restock date (if backordered) |
| `branchInventory[].branch` | string | Branch code (e.g., `BR01`) |

---

### 3. Get Item Price and Availability (Combined)

Retrieve both price and availability in a single call.

```http
GET /customers/{accountNumber}/items/{itemId}/priceAndAvailability
```

**Parameters:**

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountNumber` | path | string | Yes | 10-digit customer account number |
| `itemId` | path | string | Yes | The D&H item number |
| `quantity` | query | integer | No | Number of units requested for pricing |
| `dandh-tenant` | header | string | Yes | `dhus`, `dhca`, or `dsc` |

**Response (200):**

```json
{
  "itemId": "TI83PLUS",
  "rebate": {
    "amount": "string",
    "endDate": "2026-03-11T21:12:27.923Z"
  },
  "salesPrice": "string",
  "customerItemNumber": "TI84-PLUS-CE",
  "totalAvailableQuantity": 0,
  "branchInventory": [
    {
      "availableQuantity": 0,
      "stockReplenishDate": "2026-03-11T21:12:27.923Z",
      "branch": "BR01"
    }
  ]
}
```

> Combines the fields from both the Price and Availability responses.

---

### 4. Get Item Details (Single Item)

Retrieve detailed product information for a single item.

```http
GET /customers/{accountNumber}/items/{itemId}
```

**Parameters:**

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountNumber` | path | string | Yes | 10-digit customer account number |
| `itemId` | path | string | Yes | The D&H item number |
| `dandh-tenant` | header | string | Yes | `dhus`, `dhca`, or `dsc` |

**Response (200):**

```json
{
  "itemType": "merchandise",
  "vendorItemId": "string",
  "estimatedRetailPrice": "string",
  "description": "string",
  "customerItemNumber": "TI84-PLUS-CE",
  "vendorName": "string",
  "isFactoryDirect": true,
  "itemId": "TI83PLUS",
  "universalProductCode": "string",
  "isFreeFreightEligible": true,
  "mininumAdvertisedPrice": "string",
  "unilateralPricingPolicy": "string",
  "shippingDimensions": {
    "depth": "string",
    "width": "string",
    "weight": "string",
    "height": "string"
  },
  "enrollmentEligible": true
}
```

**Response Fields:**

| Field | Type | Description |
|---|---|---|
| `itemType` | string | Product type (e.g., `merchandise`) |
| `vendorItemId` | string | Manufacturer part number |
| `estimatedRetailPrice` | string | MSRP / estimated retail price |
| `description` | string | Product description |
| `customerItemNumber` | string | Customer's own item mapping |
| `vendorName` | string | Manufacturer / vendor name |
| `isFactoryDirect` | boolean | Whether item ships directly from vendor |
| `itemId` | string | D&H item identifier |
| `universalProductCode` | string | UPC barcode number |
| `isFreeFreightEligible` | boolean | Whether item qualifies for free shipping |
| `mininumAdvertisedPrice` | string | MAP pricing (minimum advertised price) |
| `unilateralPricingPolicy` | string | UPP pricing policy value |
| `shippingDimensions` | object | Package dimensions (depth, width, weight, height) |
| `enrollmentEligible` | boolean | Whether item is eligible for device enrollment |

---

### 5. Item Inquiry (Bulk / Search)

Query multiple items or search by various identifiers.

```http
GET /customers/{accountNumber}/items
```

**Parameters:**

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountNumber` | path | string | Yes | 10-digit customer account number |
| `vendorItemId` | query | string | No | Search by manufacturer product number |
| `items` | query | array[string] | No | List of D&H item numbers to query |
| `vendorItemIds` | query | array[string] | No | List of manufacturer product numbers |
| `customerItemNumber` | query | string | No | Look up by customer's own item number |
| `customerItemNumbers` | query | array[string] | No | List of customer item numbers |
| `universalProductCode` | query | string | No | Query by UPC barcode |
| `scrollId` | query | string | No | Pagination cursor (surrogate key) |
| `pageSize` | query | integer | No | Results per page (default: 50) |
| `dandh-tenant` | header | string | Yes | `dhus`, `dhca`, or `dsc` |

**Response (200):**

```json
{
  "elements": [
    {
      "itemType": "merchandise",
      "vendorItemId": "string",
      "estimatedRetailPrice": "string",
      "description": "string",
      "customerItemNumber": "TI84-PLUS-CE",
      "vendorName": "string",
      "isFactoryDirect": true,
      "itemId": "TI83PLUS",
      "universalProductCode": "string",
      "isFreeFreightEligible": true,
      "mininumAdvertisedPrice": "string",
      "unilateralPricingPolicy": "string",
      "shippingDimensions": {
        "depth": "string",
        "width": "string",
        "weight": "string",
        "height": "string"
      },
      "enrollmentEligible": true
    }
  ],
  "hasNext": true,
  "scrollId": "string"
}
```

**Pagination:** Use `scrollId` from the response to fetch the next page. Continue until `hasNext` is `false`.

---

### 6. Bulk Price Lookup

Get prices for multiple items in one request.

```http
GET /customers/{accountNumber}/items/price/bulk
```

**Parameters:**

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountNumber` | path | string | Yes | 10-digit customer account number |
| `items` | query | array[string] | No | List of D&H item numbers |
| `customerItemNumbers` | query | array[string] | No | List of customer item numbers |
| `dandh-tenant` | header | string | Yes | `dhus`, `dhca`, or `dsc` |

**Response (200):**

```json
[
  {
    "itemId": "TI83PLUS",
    "rebate": {
      "amount": "string",
      "endDate": "2026-03-11T21:12:27.936Z"
    },
    "salesPrice": "string",
    "customerItemNumber": "TI84-PLUS-CE"
  }
]
```

---

### 7. Bulk Availability Lookup

Get inventory availability for multiple items.

```http
GET /customers/{accountNumber}/items/availability/bulk
```

**Parameters:**

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountNumber` | path | string | Yes | 10-digit customer account number |
| `items` | query | array[string] | No | List of D&H item numbers |
| `customerItemNumbers` | query | array[string] | No | List of customer item numbers |
| `dandh-tenant` | header | string | Yes | `dhus`, `dhca`, or `dsc` |

**Response (200):**

```json
[
  {
    "itemId": "TI83PLUS",
    "customerItemNumber": "TI84-PLUS-CE",
    "totalAvailableQuantity": 0,
    "branchInventory": [
      {
        "availableQuantity": 0,
        "stockReplenishDate": "2026-03-11T21:12:27.928Z",
        "branch": "BR01"
      }
    ]
  }
]
```

---

### 8. Bulk Price and Availability

Get both price and availability for multiple items.

```http
GET /customers/{accountNumber}/items/priceAndAvailability/bulk
```

**Parameters:**

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountNumber` | path | string | Yes | 10-digit customer account number |
| `items` | query | array[string] | No | List of D&H item numbers |
| `customerItemNumbers` | query | array[string] | No | List of customer item numbers |
| `dandh-tenant` | header | string | Yes | `dhus`, `dhca`, or `dsc` |

**Response (200):**

```json
[
  {
    "itemId": "TI83PLUS",
    "rebate": {
      "amount": "string",
      "endDate": "2026-03-11T21:12:27.940Z"
    },
    "salesPrice": "string",
    "customerItemNumber": "TI84-PLUS-CE",
    "totalAvailableQuantity": 0,
    "branchInventory": [
      {
        "availableQuantity": 0,
        "stockReplenishDate": "2026-03-11T21:12:27.940Z",
        "branch": "BR01"
      }
    ]
  }
]
```

---

### 9. Get Order Tracking (Single Order)

Retrieve tracking and status information for a specific order by ID.

```http
GET /customers/{accountNumber}/salesOrders/{id}/tracking
```

**Parameters:**

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountNumber` | path | string | Yes | 10-digit customer account number |
| `id` | path | integer (int64) | Yes | The D&H order ID |
| `dandh-tenant` | header | string | Yes | `dhus`, `dhca`, or `dsc` |

**Response (200):**

```json
{
  "customerPurchaseOrder": "string",
  "enrolledDevices": [
    {
      "serialNumber": "string",
      "customerOrganizationId": "C19827DEP",
      "enrollmentOrderNumber": "OR-1023850235",
      "status": "complete"
    }
  ],
  "orderNumber": 0,
  "devicesEnrolledPostSale": false,
  "cancellationReason": "endUserCancelled",
  "orderStatus": "initialized",
  "merchandiseTotal": "string",
  "shipments": [
    {
      "isDropShipment": true,
      "shipmentTotal": "string",
      "totals": {
        "totalTax": "string",
        "total": "string",
        "subtotal": "string",
        "taxes": [
          {
            "tax": {
              "taxableAmount": "string",
              "calculatedTax": "string",
              "effectiveRate": "string",
              "jurisdiction": "string",
              "imposition": "string"
            },
            "situs": "origin"
          }
        ]
      },
      "merchandiseTotal": "string",
      "branch": "BR01",
      "charges": [
        {
          "charge": "string",
          "tax": {
            "totalTax": "string",
            "taxes": [...]
          },
          "value": "string"
        }
      ],
      "shipping": {
        "serviceType": "pickup",
        "features": ["deliveryConfirmation"],
        "carrier": "string",
        "freightAmount": "string",
        "serviceLevel": "economy"
      },
      "deliveryAddress": {
        "address": {
          "country": "str",
          "city": "string",
          "street": "string",
          "postalCode": "string",
          "region": "string"
        },
        "attention": "string",
        "deliveryName": "string"
      }
    }
  ]
}
```

**Order Status Values:**
- `initialized`
- `processing`
- `shipped`
- `delivered`
- `cancelled`

**Cancellation Reason Values:**
- `endUserCancelled`

---

### 10. Search Order Tracking (Multiple Orders)

Search for orders by order number, PO number, or invoice number.

```http
GET /customers/{accountNumber}/salesOrders/tracking
```

**Parameters:**

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountNumber` | path | string | Yes | 10-digit customer account number |
| `orderNumber` | query | integer (int64) | Conditional | D&H order number. Required if `invoiceNumber` and `purchaseOrderNumber` are not provided |
| `purchaseOrderNumber` | query | string | Conditional | Your PO number. Required if `orderNumber` and `invoiceNumber` are not provided |
| `invoiceNumber` | query | string | Conditional | D&H invoice number. Required if `orderNumber` and `purchaseOrderNumber` are not provided |
| `scrollId` | query | string | No | Pagination cursor |
| `pageSize` | query | integer | No | Results per page (default: 50) |
| `dandh-tenant` | header | string | Yes | `dhus`, `dhca`, or `dsc` |

> At least one of `orderNumber`, `purchaseOrderNumber`, or `invoiceNumber` is required.

**Response (200):**

```json
{
  "elements": [
    {
      "customerPurchaseOrder": "string",
      "orderNumber": 0,
      "orderStatus": "initialized",
      "merchandiseTotal": "string",
      "shipments": [...],
      "enrolledDevices": [...]
    }
  ],
  "hasNext": true,
  "scrollId": "string"
}
```

---

### 11. Create Sales Order

Submit a new sales order to D&H.

```http
POST /customers/{accountNumber}/salesOrders
```

**Parameters:**

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountNumber` | path | string | Yes | 10-digit customer account number |
| `dandh-tenant` | header | string | Yes | `dhus`, `dhca`, or `dsc` |

**Request Body:**

```json
{
  "customerPurchaseOrder": "11-CYi9",
  "enrollDevices": true,
  "shipping": {
    "serviceType": "Ground",
    "carrier": "FedEx",
    "allowPartialShipment": true,
    "allowBackOrder": true
  },
  "endUserData": {
    "electronicSoftwareDistributionEmail": "sample@sample.com",
    "dateOfSale": "2026-03-11T21:12:27.960Z",
    "address": "Harrison",
    "serialNumbers": [451],
    "reseller": {
      "phone": "878-098-9987",
      "accountNumber": "1234567890",
      "email": "sample@sample.com"
    },
    "userName": "geo",
    "masterContractNumber": "122",
    "authorizationNumber": "556",
    "domain": {
      "domainName": "sample.com",
      "domainAdministratorEmailAddress": "sample@sample.com"
    },
    "contact": {
      "phone": "878-098-9987",
      "fax": "878-098-9987",
      "email": "sample@sample.com"
    },
    "purchaseOrderNumber": "4iu9e-76",
    "organization": "string",
    "modelNumber": "3434",
    "department": "Education",
    "supportPlan": {
      "supportStartDate": "2026-03-11",
      "updateType": "Upgrade",
      "warrantySku": "4545"
    },
    "cisco": {
      "ccoId": "14"
    }
  },
  "deliveryAddress": {
    "address": {
      "country": "US",
      "city": "Harrisburg",
      "street": "123 State St.",
      "postalCode": "17011",
      "region": "PA"
    },
    "attention": "name",
    "deliveryName": "First Lastname"
  },
  "specialInstructions": "apply white glove service",
  "freightBillingAccount": "1234567890",
  "clientReferenceData": {
    "referenceNumber": 12345,
    "clientId": "ACME-23802",
    "submitDate": "2023-03-01"
  },
  "flooringAuthorizationNumber": "1234567890",
  "shipments": [
    {
      "clientReferenceData": {
        "referenceNumber": 12345,
        "clientId": "ACME-23802",
        "submitDate": "2023-03-01"
      },
      "lines": [
        {
          "orderQuantity": 1
        }
      ],
      "branch": "BR01"
    }
  ],
  "customerOrganizationId": "C19827DEP"
}
```

**Request Body Fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `customerPurchaseOrder` | string | Yes | Your unique purchase order number |
| `enrollDevices` | boolean | No | Whether to enroll devices (e.g., Apple DEP) |
| `shipping` | object | Yes | Shipping configuration |
| `shipping.serviceType` | string | Yes | Service type (e.g., `Ground`, `pickup`) |
| `shipping.carrier` | string | Yes | Carrier name (e.g., `FedEx`) |
| `shipping.allowPartialShipment` | boolean | No | Allow partial shipments |
| `shipping.allowBackOrder` | boolean | No | Allow backordered items |
| `deliveryAddress` | object | Yes | Ship-to address |
| `deliveryAddress.address.country` | string | Yes | 2-letter country code |
| `deliveryAddress.address.city` | string | Yes | City |
| `deliveryAddress.address.street` | string | Yes | Street address |
| `deliveryAddress.address.postalCode` | string | Yes | ZIP/postal code |
| `deliveryAddress.address.region` | string | Yes | State/province code |
| `deliveryAddress.attention` | string | No | Attention line |
| `deliveryAddress.deliveryName` | string | Yes | Recipient name |
| `endUserData` | object | No | End-user registration data (for software/licensing) |
| `specialInstructions` | string | No | Special handling instructions |
| `freightBillingAccount` | string | No | Third-party freight account number |
| `clientReferenceData` | object | No | Your internal reference data |
| `flooringAuthorizationNumber` | string | No | Floor plan financing authorization |
| `shipments` | array | Yes | Order line items grouped by shipment |
| `shipments[].lines` | array | Yes | Line items in this shipment |
| `shipments[].lines[].orderQuantity` | integer | Yes | Quantity to order |
| `shipments[].branch` | string | No | Preferred D&H branch to ship from |
| `customerOrganizationId` | string | No | Customer org ID for device enrollment |

**Response (201):** Returns the created order with assigned `orderNumber` and `id`.

---

### 12. List Available Carriers

Get available shipping carriers for order placement.

```http
GET /customers/{accountNumber}/carriers
```

**Parameters:**

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `accountNumber` | path | string | Yes | 10-digit customer account number |
| `shipMode` | query | string | No | Filter by ship mode: `parcel`, `lessThanTruckload`, `fullTruckload` |
| `scrollId` | query | string | No | Pagination cursor |
| `pageSize` | query | integer | No | Results per page (default: 50) |
| `dandh-tenant` | header | string | Yes | `dhus`, `dhca`, or `dsc` |

**Response (200):**

```json
{
  "elements": [
    {
      "shipMode": "parcel",
      "scac": "FEDX",
      "name": "FedEx",
      "description": "string"
    }
  ],
  "hasNext": true,
  "scrollId": "string"
}
```

**Response Fields:**

| Field | Type | Description |
|---|---|---|
| `shipMode` | string | `parcel`, `lessThanTruckload`, or `fullTruckload` |
| `scac` | string | Standard Carrier Alpha Code (4 chars) |
| `name` | string | Carrier display name |
| `description` | string | Carrier description |

---

## Error Responses

All endpoints return a standard error format for non-2xx responses:

```json
{
  "errorName": "string",
  "details": [
    {
      "issue": "string",
      "field": "string",
      "location": "body",
      "value": "string"
    }
  ],
  "links": [
    {
      "method": "get",
      "rel": "string",
      "href": "string"
    }
  ],
  "debugId": "string",
  "message": "string"
}
```

### HTTP Status Codes

| Code | Description |
|---|---|
| `200` | Success |
| `201` | Created (order submission) |
| `400` | Bad Request — invalid parameters |
| `401` | Unauthorized — invalid or expired token |
| `403` | Forbidden — insufficient permissions |
| `404` | Not Found — item or order not found |
| `406` | Not Acceptable |
| `422` | Unprocessable Entity — validation error |
| `500` | Internal Server Error |

---

## Pagination

Paginated endpoints use cursor-based pagination:

1. First request: omit `scrollId`, optionally set `pageSize` (default: 50)
2. Check `hasNext` in response — if `true`, more pages exist
3. Pass the returned `scrollId` value in the next request
4. Repeat until `hasNext` is `false`

**Paginated endpoints:** Item Inquiry (bulk), Order Tracking (search), Carriers

---

## Integration Notes

### Key Concepts
- **itemId**: D&H's internal item identifier (e.g., `TI83PLUS`)
- **vendorItemId**: The manufacturer's part number / SKU
- **customerItemNumber**: Your own internal product mapping
- **universalProductCode**: UPC barcode

### Branch Codes
Inventory is distributed across D&H warehouse branches. Common branch codes:
- `BR01`, `BR02`, etc.
- Use the `branch` field in order shipments to request fulfillment from a specific warehouse

### Pricing Fields
- **salesPrice**: Your reseller cost
- **estimatedRetailPrice**: MSRP
- **mininumAdvertisedPrice**: MAP — minimum price you can advertise
- **unilateralPricingPolicy**: UPP — vendor-enforced pricing

### Device Enrollment
For Apple DEP or similar programs:
- Set `enrollDevices: true` on the order
- Provide `customerOrganizationId` (your enrollment org ID)
- Track enrollment status via `enrolledDevices` in order tracking

### Recommended Workflow for Storefront
1. **Product catalog sync**: Use `GET /items` (bulk) to populate product data
2. **Real-time pricing**: Use `GET /items/{itemId}/priceAndAvailability` at checkout
3. **Order placement**: Use `POST /salesOrders` with validated cart
4. **Order tracking**: Use `GET /salesOrders/tracking` with PO number for status updates
