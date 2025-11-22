import { Injectable, Logger } from '@nestjs/common';
import { Client, PlaceInputType } from '@googlemaps/google-maps-services-js';
import { ConfigService } from '@nestjs/config';

export interface PlaceSearchParams {
  latitude: number;
  longitude: number;
  radius: number;
  type?: string;
  keyword?: string;
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  formattedAddress: string;
  location: {
    lat: number;
    lng: number;
  };
  rating?: number;
  priceLevel?: number;
  photos?: string[];
  phoneNumber?: string;
  website?: string;
  openingHours?: any;
  types?: string[];
}

@Injectable()
export class GooglePlacesService {
  private readonly logger = new Logger(GooglePlacesService.name);
  private readonly client: Client;
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.client = new Client({});
    this.apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY') || '';

    if (!this.apiKey) {
      this.logger.warn(
        'Google Maps API key not configured. Place search will not work.',
      );
    }
  }

  async searchNearbyPlaces(
    params: PlaceSearchParams,
  ): Promise<PlaceDetails[]> {
    try {
      console.log("apiKey", this.apiKey);
      const response = await this.client.placesNearby({
        params: {
          location: {
            lat: params.latitude,
            lng: params.longitude,
          },
          radius: params.radius,
          type: params.type || 'restaurant',
          keyword: params.keyword,
          key: this.apiKey,
        },
      });

      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        this.logger.error(
          `Google Places API error: ${response.data.status} - ${response.data.error_message}`,
        );
        return [];
      }

      return response.data.results.map((place) => this.mapPlaceToDetails(place));
    } catch (error) {
      this.logger.error('Error searching nearby places:', error);
      throw error;
    }
  }

  async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    try {
      const response = await this.client.placeDetails({
        params: {
          place_id: placeId,
          fields: [
            'place_id',
            'name',
            'formatted_address',
            'geometry',
            'rating',
            'price_level',
            'photos',
            'formatted_phone_number',
            'website',
            'opening_hours',
            'types',
          ],
          key: this.apiKey,
        },
      });

      if (response.data.status !== 'OK') {
        this.logger.error(`Google Places API error: ${response.data.status}`);
        return null;
      }

      return this.mapPlaceToDetails(response.data.result);
    } catch (error) {
      this.logger.error('Error getting place details:', error);
      throw error;
    }
  }

  async getPlaceByAddress(address: string): Promise<PlaceDetails | null> {
    try {
      const response = await this.client.findPlaceFromText({
        params: {
          input: address,
          inputtype: PlaceInputType.textQuery,
          fields: [
            'place_id',
            'name',
            'formatted_address',
            'geometry',
          ],
          key: this.apiKey,
        },
      });

      if (
        response.data.status !== 'OK' ||
        !response.data.candidates?.length
      ) {
        return null;
      }

      const place = response.data.candidates[0];
      return this.mapPlaceToDetails(place);
    } catch (error) {
      this.logger.error('Error finding place by address:', error);
      throw error;
    }
  }

  async getPhotoUrl(photoReference: string, maxWidth: number = 400): Promise<string> {
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${this.apiKey}`;
  }

  private mapPlaceToDetails(place: any): PlaceDetails {
    const photos = place.photos?.map((photo: any) =>
      this.getPhotoUrl(photo.photo_reference),
    ) || [];

    return {
      placeId: place.place_id,
      name: place.name,
      formattedAddress: place.formatted_address || place.vicinity || '',
      location: {
        lat: place.geometry?.location?.lat || place.geometry?.location?.lat(),
        lng: place.geometry?.location?.lng || place.geometry?.location?.lng(),
      },
      rating: place.rating,
      priceLevel: place.price_level,
      photos,
      phoneNumber: place.formatted_phone_number,
      website: place.website,
      openingHours: place.opening_hours,
      types: place.types,
    };
  }

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c); // Distance in meters
  }

  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${meters} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  }
}
