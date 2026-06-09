import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRoomTypes } from './useRoomTypes';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  }
}));

// Mock Channex handlers
vi.mock('../channex/getRoomTypes', () => ({ getRoomTypes: vi.fn() }));
vi.mock('../channex/createRoomType', () => ({ createRoomType: vi.fn() }));
vi.mock('../channex/updateRoomType', () => ({ updateRoomType: vi.fn() }));
vi.mock('../channex/deleteRoomType', () => ({ deleteRoomType: vi.fn() }));

// Mock Supabase wrappers
vi.mock('../supabase/getRoomTypes', () => ({ getRoomTypesByProperty: vi.fn() }));
vi.mock('../supabase/createRoomType', () => ({ insertRoomType: vi.fn() }));
vi.mock('../supabase/updateRoomType', () => ({ updateRoomTypeInDB: vi.fn() }));
vi.mock('../supabase/deleteRoomType', () => ({ deleteRoomTypeFromDB: vi.fn() }));

import { createRoomType as createInChannex } from '../channex/createRoomType';
import { deleteRoomType as deleteFromChannex } from '../channex/deleteRoomType';
import { insertRoomType } from '../supabase/createRoomType';
import { getRoomTypesByProperty } from '../supabase/getRoomTypes';
import { updateRoomTypeInDB } from '../supabase/updateRoomType';
import { deleteRoomTypeFromDB } from '../supabase/deleteRoomType';

describe('useRoomTypes', () => {
  const propertyId = 'local-uuid';
  const channexPropertyId = 'channex-uuid';

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock default successful load
    getRoomTypesByProperty.mockResolvedValue([]);
  });

  describe('createRoomType', () => {
    const mockForm = { title: 'Deluxe Room' };

    it('1. Successful Dual-Write', async () => {
      // Condition: Both Channex and Supabase succeed
      const channexId = 'chx-123';
      createInChannex.mockResolvedValue({ data: { id: channexId } });
      
      const expectedDbRow = { id: 'db-1', channex_id: channexId, title: 'Deluxe Room' };
      insertRoomType.mockResolvedValue(expectedDbRow);

      const { result } = renderHook(() => useRoomTypes(propertyId, channexPropertyId));
      
      // Wait for initial load
      await act(async () => {
        // flush promises
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      let createdRow;
      await act(async () => {
        createdRow = await result.current.createRoomType(mockForm);
      });

      // Assertion: Verify Channex API was called
      expect(createInChannex).toHaveBeenCalledWith(channexPropertyId, mockForm);
      
      // Assertion: Verify Supabase was called with the returned Channex ID
      expect(insertRoomType).toHaveBeenCalledWith(propertyId, channexId, mockForm);
      
      // Assertion: Verify local state was updated
      expect(createdRow).toEqual(expectedDbRow);
      expect(result.current.roomTypes).toContainEqual(expectedDbRow);
    });

    it('2. Channex Failure', async () => {
      // Condition: Channex API throws an error
      const mockError = new Error('422 Validation Error');
      createInChannex.mockRejectedValue(mockError);

      const { result } = renderHook(() => useRoomTypes(propertyId, channexPropertyId));

      let error;
      await act(async () => {
        try {
          await result.current.createRoomType(mockForm);
        } catch (e) {
          error = e;
        }
      });

      // Assertion: Verify error is caught/thrown
      expect(error.message).toBe('422 Validation Error');

      // Assertion: Verify Supabase insert is never called
      expect(insertRoomType).not.toHaveBeenCalled();
      
      // Local state should remain empty
      expect(result.current.roomTypes).toEqual([]);
    });

    it('3. Supabase Failure (Rollback Triggered)', async () => {
      // Condition: Channex API succeeds, but Supabase insert throws an error
      const channexId = 'chx-123';
      createInChannex.mockResolvedValue({ data: { id: channexId } });
      
      const mockDbError = new Error('Supabase constraint violation');
      insertRoomType.mockRejectedValue(mockDbError);

      const { result } = renderHook(() => useRoomTypes(propertyId, channexPropertyId));

      let error;
      await act(async () => {
        try {
          await result.current.createRoomType(mockForm);
        } catch (e) {
          error = e;
        }
      });

      // Assertion: Verify error is caught/thrown
      expect(error.message).toBe('Supabase constraint violation');

      // Assertion: Verify Channex was called
      expect(createInChannex).toHaveBeenCalledWith(channexPropertyId, mockForm);
      
      // Assertion: Verify Supabase was called and failed
      expect(insertRoomType).toHaveBeenCalledWith(propertyId, channexId, mockForm);
      
      // Assertion: Verify the delete Channex function is called to clean up the orphaned record
      expect(deleteFromChannex).toHaveBeenCalledWith(channexId);
      
      // Local state should remain empty
      expect(result.current.roomTypes).toEqual([]);
    });
  });

  describe('deleteRoomType', () => {
    const mockRoomType = { 
      id: 'local-1', 
      channex_room_type_id: 'chx-1', 
      title: 'Deluxe Room',
      count_of_rooms: 1,
      occ_adults: 2,
      occ_children: 0,
      occ_infants: 0,
      default_occupancy: 2,
      capacity: 2,
      room_kind: 'room',
      content_description: null
    };

    beforeEach(() => {
      getRoomTypesByProperty.mockResolvedValue([mockRoomType]);
    });

    it('1. Successful Deletion', async () => {
      deleteFromChannex.mockResolvedValue(true);
      deleteRoomTypeFromDB.mockResolvedValue(true);

      const { result } = renderHook(() => useRoomTypes(propertyId, channexPropertyId));
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.roomTypes).toHaveLength(1);

      await act(async () => {
        await result.current.deleteRoomType(mockRoomType.id, mockRoomType.channex_room_type_id);
      });

      expect(deleteFromChannex).toHaveBeenCalledWith(mockRoomType.channex_room_type_id);
      expect(deleteRoomTypeFromDB).toHaveBeenCalledWith(mockRoomType.id);
      expect(result.current.roomTypes).toHaveLength(0);
    });

    it('2. Supabase Failure (Rollback Triggered)', async () => {
      deleteFromChannex.mockResolvedValue(true);
      
      const mockDbError = new Error('Foreign key violation');
      deleteRoomTypeFromDB.mockRejectedValue(mockDbError);

      const newChannexId = 'new-chx-123';
      createInChannex.mockResolvedValue({ data: { id: newChannexId } });
      
      updateRoomTypeInDB.mockResolvedValue({ ...mockRoomType, channex_room_type_id: newChannexId });

      const { result } = renderHook(() => useRoomTypes(propertyId, channexPropertyId));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      let error;
      await act(async () => {
        try {
          await result.current.deleteRoomType(mockRoomType.id, mockRoomType.channex_room_type_id);
        } catch (e) {
          error = e;
        }
      });

      expect(error.message).toBe('Foreign key violation');
      expect(deleteFromChannex).toHaveBeenCalledWith(mockRoomType.channex_room_type_id);
      expect(createInChannex).toHaveBeenCalledWith(channexPropertyId, expect.objectContaining({
        title: 'Deluxe Room',
        capacity: 2
      }));
      expect(updateRoomTypeInDB).toHaveBeenCalledWith(mockRoomType.id, propertyId, expect.objectContaining({
        channex_room_type_id: newChannexId
      }));
      expect(result.current.roomTypes[0].channex_room_type_id).toBe(newChannexId);
    });
  });
});
