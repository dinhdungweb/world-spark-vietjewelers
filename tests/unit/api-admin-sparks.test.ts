import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getPending } from '@/app/api/admin/sparks/pending/route';
import { POST as approveSpark } from '@/app/api/admin/sparks/[id]/approve/route';
import { POST as rejectSpark } from '@/app/api/admin/sparks/[id]/reject/route';

// Mock dependencies
vi.mock('@/lib/auth-helpers', () => ({
  requireAuth: vi.fn()
}));

vi.mock('@/lib/spark-service', () => ({
  sparkService: {
    getPendingSparks: vi.fn(),
    approveSpark: vi.fn(),
    rejectSpark: vi.fn()
  }
}));

import { requireAuth } from '@/lib/auth-helpers';
import { sparkService } from '@/lib/spark-service';

describe('Admin Sparks API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/sparks/pending', () => {
    it('should return pending sparks when authenticated', async () => {
      const mockSession = {
        user: { id: 'admin-1', email: 'admin@example.com' }
      };
      const mockSparks = [
        {
          id: 'spark-1',
          text: 'Test spark',
          latitude: 52.5,
          longitude: 13.4,
          category: 'Thought',
          locationDisplay: 'Near Berlin, Germany',
          status: 'pending',
          createdAt: new Date()
        }
      ];

      vi.mocked(requireAuth).mockResolvedValue(mockSession as any);
      vi.mocked(sparkService.getPendingSparks).mockResolvedValue(mockSparks as any);

      const response = await getPending();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe('spark-1');
      expect(data[0].text).toBe('Test spark');
      expect(data[0].status).toBe('pending');
      expect(requireAuth).toHaveBeenCalled();
      expect(sparkService.getPendingSparks).toHaveBeenCalled();
    });

    it('should return 401 when not authenticated', async () => {
      vi.mocked(requireAuth).mockRejectedValue(new Error('Unauthorized'));

      const response = await getPending();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(data.code).toBe('AUTH_ERROR');
    });
  });

  describe('POST /api/admin/sparks/[id]/approve', () => {
    it('should approve spark when authenticated', async () => {
      const mockSession = {
        user: { id: 'admin-1', email: 'admin@example.com' }
      };
      const mockApprovedSpark = {
        id: 'spark-1',
        text: 'Test spark',
        latitude: 52.5,
        longitude: 13.4,
        category: 'Thought',
        locationDisplay: 'Near Berlin, Germany',
        status: 'approved',
        createdAt: new Date(),
        approvedAt: new Date()
      };

      vi.mocked(requireAuth).mockResolvedValue(mockSession as any);
      vi.mocked(sparkService.approveSpark).mockResolvedValue(mockApprovedSpark as any);

      const mockRequest = {} as any;
      const mockParams = { params: { id: 'spark-1' } };

      const response = await approveSpark(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Spark approved successfully');
      expect(data.spark.id).toBe('spark-1');
      expect(data.spark.status).toBe('approved');
      expect(data.spark.approvedAt).toBeDefined();
      expect(requireAuth).toHaveBeenCalled();
      expect(sparkService.approveSpark).toHaveBeenCalledWith('spark-1');
    });

    it('should return 401 when not authenticated', async () => {
      vi.mocked(requireAuth).mockRejectedValue(new Error('Unauthorized'));

      const mockRequest = {} as any;
      const mockParams = { params: { id: 'spark-1' } };

      const response = await approveSpark(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(data.code).toBe('AUTH_ERROR');
    });

    it('should return 404 when spark not found', async () => {
      const mockSession = {
        user: { id: 'admin-1', email: 'admin@example.com' }
      };

      vi.mocked(requireAuth).mockResolvedValue(mockSession as any);
      vi.mocked(sparkService.approveSpark).mockRejectedValue(
        new Error('Record to update not found')
      );

      const mockRequest = {} as any;
      const mockParams = { params: { id: 'nonexistent' } };

      const response = await approveSpark(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Spark not found');
      expect(data.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/admin/sparks/[id]/reject', () => {
    it('should reject spark when authenticated', async () => {
      const mockSession = {
        user: { id: 'admin-1', email: 'admin@example.com' }
      };

      vi.mocked(requireAuth).mockResolvedValue(mockSession as any);
      vi.mocked(sparkService.rejectSpark).mockResolvedValue(undefined);

      const mockRequest = {} as any;
      const mockParams = { params: { id: 'spark-1' } };

      const response = await rejectSpark(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Spark rejected successfully');
      expect(requireAuth).toHaveBeenCalled();
      expect(sparkService.rejectSpark).toHaveBeenCalledWith('spark-1');
    });

    it('should return 401 when not authenticated', async () => {
      vi.mocked(requireAuth).mockRejectedValue(new Error('Unauthorized'));

      const mockRequest = {} as any;
      const mockParams = { params: { id: 'spark-1' } };

      const response = await rejectSpark(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(data.code).toBe('AUTH_ERROR');
    });

    it('should return 404 when spark not found', async () => {
      const mockSession = {
        user: { id: 'admin-1', email: 'admin@example.com' }
      };

      vi.mocked(requireAuth).mockResolvedValue(mockSession as any);
      vi.mocked(sparkService.rejectSpark).mockRejectedValue(
        new Error('Record to update not found')
      );

      const mockRequest = {} as any;
      const mockParams = { params: { id: 'nonexistent' } };

      const response = await rejectSpark(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Spark not found');
      expect(data.code).toBe('NOT_FOUND');
    });
  });
});
