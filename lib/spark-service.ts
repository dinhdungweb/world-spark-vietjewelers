/**
 * SparkService handles business logic for spark management
 * including creation, approval, rejection, and retrieval.
 */

import { prisma } from './prisma';
import { contentFilterService } from './content-filter-service';
import { locationService } from './location-service';
import { Decimal } from '@prisma/client/runtime/library';

export enum SparkStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface Spark {
  id: string;
  text: string;
  latitude: number;
  longitude: number;
  category: string;
  locationDisplay: string;
  status: SparkStatus;
  createdAt: Date;
  approvedAt?: Date;
}

export interface SparkSubmission {
  text: string;
  latitude: number;
  longitude: number;
  category: string;
}

export class SparkService {
  /**
   * Retrieves all approved sparks for public display on the globe
   */
  async getApprovedSparks(): Promise<Spark[]> {
    const sparks = await prisma.spark.findMany({
      where: {
        status: SparkStatus.APPROVED
      },
      orderBy: {
        approvedAt: 'desc'
      }
    });

    return sparks.map(this.mapSparkFromDb);
  }

  /**
   * Retrieves all pending sparks for admin moderation
   */
  async getPendingSparks(): Promise<Spark[]> {
    return this.getSparksByStatus(SparkStatus.PENDING);
  }

  /**
   * Retrieves sparks by status with pagination support
   */
  async getSparksByStatus(status: SparkStatus, take = 50, skip = 0): Promise<Spark[]> {
    const sparks = await prisma.spark.findMany({
      where: {
        status: status
      },
      orderBy: status === SparkStatus.PENDING ? { createdAt: 'asc' } : { approvedAt: 'desc' },
      take,
      skip
    });

    return sparks.map(this.mapSparkFromDb);
  }

  /**
   * Returns count of sparks grouped by status
   */
  async getSparkCounts(): Promise<{ pending: number; approved: number; rejected: number }> {
    const counts = await prisma.spark.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    // Default to 0
    const result = {
      [SparkStatus.PENDING]: 0,
      [SparkStatus.APPROVED]: 0,
      [SparkStatus.REJECTED]: 0
    };

    counts.forEach(c => {
      // @ts-ignore
      result[c.status] = c._count.id;
    });

    return {
      pending: result[SparkStatus.PENDING],
      approved: result[SparkStatus.APPROVED],
      rejected: result[SparkStatus.REJECTED]
    };
  }

  /**
   * Creates a new spark with validation and location approximation
   * Returns the created spark in pending status
   */
  async createSpark(data: SparkSubmission): Promise<Spark> {
    // Validate content
    const validation = contentFilterService.validate(data.text);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Approximate location for privacy
    const approximateLocation = await locationService.approximateLocation(
      data.latitude,
      data.longitude
    );

    // Create spark in database with pending status
    const spark = await prisma.spark.create({
      data: {
        text: data.text,
        latitude: new Decimal(approximateLocation.latitude),
        longitude: new Decimal(approximateLocation.longitude),
        category: data.category,
        locationDisplay: approximateLocation.displayName,
        status: SparkStatus.PENDING
      }
    });

    return this.mapSparkFromDb(spark);
  }

  /**
   * Approves a pending spark, making it visible on the public globe
   */
  async approveSpark(sparkId: string): Promise<Spark> {
    const spark = await prisma.spark.update({
      where: {
        id: sparkId
      },
      data: {
        status: SparkStatus.APPROVED,
        approvedAt: new Date()
      }
    });

    return this.mapSparkFromDb(spark);
  }

  /**
   * Rejects a pending spark, preventing it from appearing on the globe
   */
  async rejectSpark(sparkId: string): Promise<void> {
    await prisma.spark.update({
      where: {
        id: sparkId
      },
      data: {
        status: SparkStatus.REJECTED
      }
    });
  }

  /**
   * Retrieves a random approved spark for the "Next spark" feature
   */
  async getRandomSpark(): Promise<Spark | null> {
    // Get count of approved sparks
    const count = await prisma.spark.count({
      where: {
        status: SparkStatus.APPROVED
      }
    });

    if (count === 0) {
      return null;
    }

    // Generate random skip value
    const skip = Math.floor(Math.random() * count);

    // Get random spark
    const spark = await prisma.spark.findFirst({
      where: {
        status: SparkStatus.APPROVED
      },
      skip,
      take: 1
    });

    return spark ? this.mapSparkFromDb(spark) : null;
  }

  /**
   * Maps database spark model to service interface
   */
  private mapSparkFromDb(dbSpark: any): Spark {
    return {
      id: dbSpark.id,
      text: dbSpark.text,
      latitude: parseFloat(dbSpark.latitude.toString()),
      longitude: parseFloat(dbSpark.longitude.toString()),
      category: dbSpark.category,
      locationDisplay: dbSpark.locationDisplay,
      status: dbSpark.status as SparkStatus,
      createdAt: dbSpark.createdAt,
      approvedAt: dbSpark.approvedAt || undefined
    };
  }
}

// Export singleton instance
export const sparkService = new SparkService();
