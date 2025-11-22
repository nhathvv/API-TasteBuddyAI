import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export interface Location {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  formattedAddress: string;
}

export interface OpeningHours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

export interface PriceRange {
  min: number;
  max: number;
  currency: string;
}

@Schema({ timestamps: true, collection: 'restaurants' })
export class Restaurant extends Document {
  @ApiProperty({ description: 'Google Place ID', example: 'ChIJN1t_tD...' })
  @Prop({ required: true, unique: true })
  placeId: string;

  @ApiProperty({ description: 'Restaurant name', example: 'Healthy Bowl' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ description: 'Restaurant description' })
  @Prop()
  description: string;

  @ApiProperty({ description: 'Restaurant location (GeoJSON)' })
  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  })
  location: Location;

  @ApiProperty({ description: 'Restaurant address' })
  @Prop({
    type: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
      formattedAddress: String,
    },
    required: true,
  })
  address: Address;

  @ApiProperty({ description: 'Phone number' })
  @Prop()
  phoneNumber: string;

  @ApiProperty({ description: 'Website URL' })
  @Prop()
  website: string;

  @ApiProperty({ description: 'Average rating (0-5)', example: 4.5 })
  @Prop({ min: 0, max: 5 })
  rating: number;

  @ApiProperty({ description: 'Total number of reviews', example: 120 })
  @Prop({ default: 0 })
  totalReviews: number;

  @ApiProperty({ description: 'Price range (1-4, $ to $$$$)', example: 2 })
  @Prop({ min: 1, max: 4 })
  priceLevel: number;

  @ApiProperty({ description: 'Average price range per person' })
  @Prop({
    type: {
      min: Number,
      max: Number,
      currency: { type: String, default: 'VND' },
    },
  })
  priceRange: PriceRange;

  @ApiProperty({ description: 'Restaurant photos URLs' })
  @Prop({ type: [String], default: [] })
  photos: string[];

  @ApiProperty({ description: 'Opening hours' })
  @Prop({
    type: {
      monday: String,
      tuesday: String,
      wednesday: String,
      thursday: String,
      friday: String,
      saturday: String,
      sunday: String,
    },
  })
  openingHours: OpeningHours;

  @ApiProperty({ description: 'Cuisine types', example: ['Vietnamese', 'Asian'] })
  @Prop({ type: [String], default: [] })
  cuisineTypes: string[];

  @ApiProperty({ description: 'Whether restaurant is currently open' })
  @Prop({ default: false })
  isOpen: boolean;

  @ApiProperty({ description: 'Distance from search location (meters)' })
  distance?: number;
}

export const RestaurantSchema = SchemaFactory.createForClass(Restaurant);

// Create 2dsphere index for geospatial queries
RestaurantSchema.index({ location: '2dsphere' });
