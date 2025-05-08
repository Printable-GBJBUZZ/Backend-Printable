
const API_KEY = Deno.env.get("DISTANCE_MATRIX_GOOGLE_API_KEY");
const BASE_URL =
  Deno.env.get("GOOGLE_API_BASE_URL") ||
  "https://maps.googleapis.com/maps/api/distancematrix/json";


export interface Merchant {
        merchantId: string;
        shopName: string;
        MerchantImages: string[] | null;
        distance: string;
        lat: string | null;
        long: string | null;
    }



export interface DistanceMatrixResult {
  merchantId: string;
  shopName: string;
  MerchantImages: string[]|null;
  googleDistance: string; 
  duration: string; 
  durationInTraffic: string; 
}

export async function getDistanceMatrix(
  origin: [number, number],
  merchants: Merchant[],
): Promise<DistanceMatrixResult[] | null> {

  const destinations = merchants
    .map((m) => `${m.lat},${m.long}`)
    .join("|");

  const url = `${BASE_URL}?origins=${origin[0]},${origin[1]}&destinations=${destinations}&mode=driving&departure_time=now&key=${API_KEY}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    const result = await response.json();
    console.log("Google API result:", result);

    if (!result.rows || !result.rows[0]) {
      throw new Error("Invalid API response");
    }


    return merchants.map((m, index) => {
      const element = result.rows[0].elements[index];
      return {
        merchantId: m.merchantId,
        shopName: m.shopName,
        MerchantImages: m.MerchantImages,
        googleDistance: element.distance
          ? element.distance.text
          : "N/A",
        duration: element.duration ? element.duration.text : "N/A",
        durationInTraffic: element.duration_in_traffic
          ? element.duration_in_traffic.text
          : "N/A",
      };
    });
  } catch (error) {
    console.error("Google API Error:", error);
    return null;
  }
}
