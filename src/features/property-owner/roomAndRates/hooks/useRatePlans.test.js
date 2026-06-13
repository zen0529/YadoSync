import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRatePlans } from './useRatePlans';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  }
}));

// Mock Channex handlers
vi.mock('../channex/getRatePlans', () => ({ getRatePlans: vi.fn() }));
vi.mock('../channex/createRatePlan', () => ({ createRatePlan: vi.fn() }));
vi.mock('../channex/deleteRatePlan', () => ({ deleteRatePlan: vi.fn() }));

// Mock Supabase wrappers
vi.mock('../supabase/getRatePlans', () => ({ getRatePlansByProperty: vi.fn() }));
vi.mock('../supabase/createRatePlan', () => ({ insertRatePlan: vi.fn() }));
vi.mock('../supabase/deleteRatePlan', () => ({ deleteRatePlanFromDB: vi.fn() }));

import { createRatePlan as createInChannex } from '../channex/createRatePlan';
import { deleteRatePlan as deleteFromChannex } from '../channex/deleteRatePlan';
import { insertRatePlan } from '../supabase/createRatePlan';
import { getRatePlansByProperty } from '../supabase/getRatePlans';

describe('useRatePlans', () => {
  const propertyId = 'local-uuid';
  const channexPropertyId = 'channex-uuid';

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock default successful load
    getRatePlansByProperty.mockResolvedValue([]);
  });

  describe('createRatePlan', () => {
    const mockForm = { title: 'Standard Rate' };
    const roomTypeId = 'local-room-type-uuid';
    const channexRoomTypeId = 'channex-room-type-uuid';

    it('1. Successful Dual-Write', async () => {
      // Condition: Both Channex and Supabase succeed
      const channexId = 'chx-rp-123';
      createInChannex.mockResolvedValue({ data: { id: channexId } });
      
      const expectedDbRow = { id: 'db-rp-1', channex_id: channexId, room_type_id: roomTypeId, title: 'Standard Rate' };
      insertRatePlan.mockResolvedValue(expectedDbRow);

      const { result } = renderHook(() => useRatePlans(propertyId, channexPropertyId));
      
      // Wait for initial load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      let createdRow;
      await act(async () => {
        createdRow = await result.current.createRatePlan(mockForm, roomTypeId, channexRoomTypeId);
      });

      // Assertion: Verify Channex API was called
      expect(createInChannex).toHaveBeenCalledWith(channexPropertyId, channexRoomTypeId, mockForm);
      
      // Assertion: Verify Supabase was called with the returned Channex ID
      expect(insertRatePlan).toHaveBeenCalledWith(propertyId, roomTypeId, channexId, mockForm);
      
      // Assertion: Verify local state was updated
      expect(createdRow).toEqual(expectedDbRow);
      expect(result.current.ratePlans).toContainEqual(expectedDbRow);
    });

    it('2. Channex Failure', async () => {
      // Condition: Channex API throws an error
      const mockError = new Error('422 Validation Error');
      createInChannex.mockRejectedValue(mockError);

      const { result } = renderHook(() => useRatePlans(propertyId, channexPropertyId));

      let error;
      await act(async () => {
        try {
          await result.current.createRatePlan(mockForm, roomTypeId, channexRoomTypeId);
        } catch (e) {
          error = e;
        }
      });

      // Assertion: Verify error is caught/thrown
      expect(error.message).toBe('422 Validation Error');

      // Assertion: Verify Supabase insert is never called
      expect(insertRatePlan).not.toHaveBeenCalled();
      
      // Local state should remain empty
      expect(result.current.ratePlans).toEqual([]);
    });

    it('3. Supabase Failure (Rollback Triggered)', async () => {
      // Condition: Channex API succeeds, but Supabase insert throws an error
      const channexId = 'chx-rp-123';
      createInChannex.mockResolvedValue({ data: { id: channexId } });
      
      const mockDbError = new Error('Supabase constraint violation');
      insertRatePlan.mockRejectedValue(mockDbError);

      const { result } = renderHook(() => useRatePlans(propertyId, channexPropertyId));

      let error;
      await act(async () => {
        try {
          await result.current.createRatePlan(mockForm, roomTypeId, channexRoomTypeId);
        } catch (e) {
          error = e;
        }
      });

      // Assertion: Verify error is caught/thrown
      expect(error.message).toBe('Supabase constraint violation');

      // Assertion: Verify Channex was called
      expect(createInChannex).toHaveBeenCalledWith(channexPropertyId, channexRoomTypeId, mockForm);
      
      // Assertion: Verify Supabase was called and failed
      expect(insertRatePlan).toHaveBeenCalledWith(propertyId, roomTypeId, channexId, mockForm);
      
      // Assertion: Verify the delete Channex function is called to clean up the orphaned record
      expect(deleteFromChannex).toHaveBeenCalledWith(channexId);
      
      // Local state should remain empty
      expect(result.current.ratePlans).toEqual([]);
    });
  });
});
