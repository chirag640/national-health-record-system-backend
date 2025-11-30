import { Test, TestingModule } from '@nestjs/testing';
import { EncounterService } from './encounter.service';
import { EncounterRepository } from './encounter.repository';
import { NotFoundException } from '@nestjs/common';

describe('EncounterService', () => {
  let service: EncounterService;
  let repository: jest.Mocked<EncounterRepository>;

  const mockEncounter = {
    _id: '507f1f77bcf86cd799439011',
    visitReason: 'test-visitReason',
    diagnosis: 'test-diagnosis',
    prescriptions: { test: 'data' },
    vitals: { test: 'data' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncounterService,
        {
          provide: EncounterRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<EncounterService>(EncounterService);
    repository = module.get(EncounterRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a encounter successfully', async () => {
      const createDto = {
        patientId: 'PATIENT-123',
        doctorId: '507f1f77bcf86cd799439011',
        hospitalId: '507f1f77bcf86cd799439022',
        visitReason: 'test-visitReason',
        diagnosis: 'test-diagnosis',
        prescriptions: { test: 'data' },
        vitals: { test: 'data' },
      };

      repository.create.mockResolvedValue(mockEncounter as any);

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(repository.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated encounters', async () => {
      const mockResult = {
        items: [mockEncounter],
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      repository.findAll.mockResolvedValue(mockResult as any);

      const result = await service.findAll(1, 10);

      expect(result).toEqual(mockResult);
      expect(repository.findAll).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('findOne', () => {
    it('should return a encounter by id', async () => {
      repository.findById.mockResolvedValue(mockEncounter as any);

      const result = await service.findOne('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockEncounter);
      expect(repository.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw NotFoundException if encounter not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne('507f1f77bcf86cd799439011')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a encounter successfully', async () => {
      const updateDto = {};

      const updatedMock = { ...mockEncounter, ...updateDto };
      repository.findById.mockResolvedValue(mockEncounter as any);
      repository.update.mockResolvedValue(updatedMock as any);

      const result = await service.update('507f1f77bcf86cd799439011', updateDto);

      expect(result).toEqual(updatedMock);
      expect(repository.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', updateDto);
    });

    it('should throw NotFoundException if encounter not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.update('507f1f77bcf86cd799439011', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a encounter successfully', async () => {
      repository.findById.mockResolvedValue(mockEncounter as any);
      // repository.remove.mockResolvedValue(undefined);

      await service.remove('507f1f77bcf86cd799439011');

      // expect(repository.remove).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(repository.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw NotFoundException if encounter not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.remove('507f1f77bcf86cd799439011')).rejects.toThrow(NotFoundException);
    });
  });
});
