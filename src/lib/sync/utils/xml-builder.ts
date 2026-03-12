/**
 * TD SYNNEX XML Request Builder
 *
 * Builds the XML body for the TD SYNNEX PriceAvailability (PNA) API.
 * Endpoint: ec.us.tdsynnex.com/SynnexXML/PriceAvailability
 */

import { XMLBuilder } from "fast-xml-parser";

const builder = new XMLBuilder({
  ignoreAttributes: true,
  format: true,
  suppressEmptyNode: false,
});

/**
 * Build a PriceAvailability XML request for TD SYNNEX.
 *
 * @param params.customerNo — TD SYNNEX EC customer number
 * @param params.userName — EC Express login username
 * @param params.password — EC Express login password
 * @param params.mpns — array of manufacturer part numbers to query
 * @returns XML string with <?xml?> declaration
 */
export function buildPnaRequest(params: {
  customerNo: string;
  userName: string;
  password: string;
  mpns: string[];
}): string {
  const { customerNo, userName, password, mpns } = params;

  // fast-xml-parser XMLBuilder expects an object graph.
  // For repeated <skuList> elements we pass an array.
  const requestObj = {
    priceRequest: {
      customerNo,
      userName,
      password,
      skuList: mpns.map((mpn) => ({ mfgPN: mpn })),
    },
  };

  const xmlBody = builder.build(requestObj) as string;

  return `<?xml version="1.0" encoding="UTF-8"?>\n${xmlBody}`.trimEnd();
}
