const GOONG_API_KEY = "EiVlij4sGBI3kqNoebCG5eTotTTdvJ1ZzIMsUlp0";
const GOONG_API_URL = "https://rsapi.goong.io";

export interface DirectionsResponse {
  status: string;
  routes: Array<{
    overview_polyline: {
      points: string;
    };
    legs: Array<{
      distance: {
        text: string;
        value: number;
      };
      duration: {
        text: string;
        value: number;
      };
    }>;
  }>;
}

export const goongApi = {
  getDirections: async (
    origin: [number, number],
    destination: [number, number]
  ): Promise<DirectionsResponse> => {
    const url = `${GOONG_API_URL}/Direction?origin=${origin[1]},${origin[0]}&destination=${destination[1]},${destination[0]}&vehicle=car&api_key=${GOONG_API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching directions:", error);
      throw error;
    }
  },

  // Hàm decode polyline từ Google's encoded polyline algorithm
  decodePolyline: (encoded: string): number[][] => {
    const points: number[][] = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let shift = 0;
      let result = 0;

      do {
        let b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (result & 0x20);

      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        let b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (result & 0x20);

      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push([lng * 1e-5, lat * 1e-5]);
    }

    return points;
  },
};
