import { Injectable, Logger } from '@nestjs/common';
import { Client, PlaceInputType } from '@googlemaps/google-maps-services-js';
import axios from 'axios';
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
      const response = await axios.post(
        'https://places.googleapis.com/v1/places:searchNearby',
        {
          includedTypes: [params.type || 'restaurant'],
          maxResultCount: 20,
          locationRestriction: {
            circle: {
              center: {
                latitude: params.latitude,
                longitude: params.longitude,
              },
              radius: params.radius,
            },
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': this.apiKey,
            'X-Goog-FieldMask':
              'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.priceLevel,places.photos,places.nationalPhoneNumber,places.websiteUri,places.regularOpeningHours,places.types',
          },
        },
      );

      if (!response.data.places) {
        return [];
      }

      return response.data.places.map((place) => this.mapPlaceToDetails(place));
    } catch (error) {
      this.logger.error('Error searching nearby places:', error);
      if (axios.isAxiosError(error)) {
        this.logger.error(
          `API Error: ${error.response?.status} - ${JSON.stringify(
            error.response?.data,
          )}`,
        );
      }
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

      return this.mapLegacyPlaceToDetails(response.data.result);
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
      return this.mapLegacyPlaceToDetails(place);
    } catch (error) {
      this.logger.error('Error finding place by address:', error);
      throw error;
    }
  }

  async getPhotoUrl(photoReference: string, maxWidth: number = 400): Promise<string> {
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${this.apiKey}`;
  }

  private mapPlaceToDetails(place: any): PlaceDetails {
    const photos =
      place.photos?.map(
        (photo: any) =>
          `https://places.googleapis.com/v1/${photo.name}/media?key=${this.apiKey}&maxHeightPx=400&maxWidthPx=400`,
      ) || [];

    const priceLevelMap: { [key: string]: number } = {
      PRICE_LEVEL_FREE: 0,
      PRICE_LEVEL_INEXPENSIVE: 1,
      PRICE_LEVEL_MODERATE: 2,
      PRICE_LEVEL_EXPENSIVE: 3,
      PRICE_LEVEL_VERY_EXPENSIVE: 4,
    };

    return {
      placeId: place.id,
      name: place.displayName?.text || place.name,
      formattedAddress: place.formattedAddress || '',
      location: {
        lat: place.location?.latitude || 0,
        lng: place.location?.longitude || 0,
      },
      rating: place.rating,
      priceLevel: priceLevelMap[place.priceLevel] || undefined,
      photos,
      phoneNumber: place.nationalPhoneNumber,
      website: place.websiteUri,
      openingHours: place.regularOpeningHours,
      types: place.types,
    };
  }

  private mapLegacyPlaceToDetails(place: any): PlaceDetails {
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
