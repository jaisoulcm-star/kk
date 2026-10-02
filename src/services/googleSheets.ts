import { Order, Product } from "../types";

export async function createSpreadsheet(title: string, accessToken: string): Promise<{ id: string, url: string }> {
  const response = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: {
        title,
      },
    }),
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.error?.message || "Failed to create spreadsheet");
  }

  const data = await response.json();
  return {
    id: data.spreadsheetId,
    url: data.spreadsheetUrl,
  };
}

export async function appendValues(
  spreadsheetId: string,
  range: string,
  values: any[][],
  accessToken: string
): Promise<any> {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values,
      }),
    }
  );

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.error?.message || "Failed to write values to sheet");
  }

  return await response.json();
}

export async function exportOrdersToSheets(orders: Order[], title: string, accessToken: string): Promise<{ id: string, url: string }> {
  const { id, url } = await createSpreadsheet(title, accessToken);
  
  const headers = [
    "Order ID", 
    "Customer Name", 
    "Email", 
    "Total Amount", 
    "Status", 
    "Shipping Address", 
    "Mobile Number",
    "Items Purchased", 
    "Date"
  ];

  const rows = orders.map((o) => {
    let dateStr = "N/A";
    if (o.createdAt) {
      if (typeof o.createdAt === "object" && "seconds" in o.createdAt) {
        dateStr = new Date(o.createdAt.seconds * 1000).toLocaleString("en-IN");
      } else if (o.createdAt instanceof Date) {
        dateStr = o.createdAt.toLocaleString("en-IN");
      } else {
        dateStr = new Date(o.createdAt).toLocaleString("en-IN");
      }
    }

    return [
      o.id,
      o.customerName || "Anonymous",
      o.email || "N/A",
      o.totalAmount,
      o.status,
      o.address || "N/A",
      o.phone || "N/A",
      o.items?.map(item => `${item.name} (Qty: ${item.quantity})`).join(", ") || "",
      dateStr
    ];
  });

  await appendValues(id, "Sheet1!A1", [headers, ...rows], accessToken);

  return { id, url };
}

export async function exportProductsToSheets(products: Product[], title: string, accessToken: string): Promise<{ id: string, url: string }> {
  const { id, url } = await createSpreadsheet(title, accessToken);

  const headers = [
    "Product ID",
    "Name",
    "Subtitle / Origin",
    "Category",
    "Price (INR)",
    "Stock Count",
    "Featured Piece?",
    "New Arrival?",
    "Best Seller?"
  ];

  const rows = products.map((p) => [
    p.id,
    p.name,
    p.subtitle || "",
    p.category,
    p.price,
    p.stock || 0,
    p.isFeatured ? "Yes" : "No",
    p.isNew ? "Yes" : "No",
    p.isBestSeller ? "Yes" : "No"
  ]);

  await appendValues(id, "Sheet1!A1", [headers, ...rows], accessToken);

  return { id, url };
}
