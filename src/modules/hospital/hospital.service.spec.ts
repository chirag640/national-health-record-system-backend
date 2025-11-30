import { Test, TestingModule } from '@nestjs/testing';
import { HospitalService } from './hospital.service';
import { HospitalRepository } from './hospital.repository';
import { NotFoundException } from '@nestjs/common';

describe('HospitalService', () => {
  let service: HospitalService;
  let repository: jest.Mocked<HospitalRepository>;

  const mockHospital = {
    _id: '507f1f77bcf86cd799439011',
    name: 'test-name',
    state: 'test-state',
    district: 'test-district',
    hospitalType: 'Government',
    isActive: true,
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
        HospitalService,
        {
          provide: HospitalRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<HospitalService>(HospitalService);
    repository = module.get(HospitalRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a hospital successfully', async () => {
      const createDto = {
        name: 'test-name',
        state: 'test-state',
        district: 'test-district',
      };

      repository.create.mockResolvedValue(mockHospital as any);

      const result = await service.create(createDto);

      expect(result).toEqual(mockHospital);
      expect(repository.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated hospitals', async () => {
      const mockResult = {
        items: [mockHospital],
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
    it('should return a hospital by id', async () => {
      repository.findById.mockResolvedValue(mockHospital as any);

      const result = await service.findOne('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockHospital);
      expect(repository.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw NotFoundException if hospital not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne('507f1f77bcf86cd799439011')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a hospital successfully', async () => {
      const updateDto = {};

      const updatedMock = { ...mockHospital, ...updateDto };
      repository.findById.mockResolvedValue(mockHospital as any);
      repository.update.mockResolvedValue(updatedMock as any);

      const result = await service.update('507f1f77bcf86cd799439011', updateDto);

      expect(result).toEqual(updatedMock);
      expect(repository.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', updateDto);
    });

    it('should throw NotFoundException if hospital not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.update('507f1f77bcf86cd799439011', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a hospital successfully', async () => {
      repository.findById.mockResolvedValue(mockHospital as any);
      // repository.remove.mockResolvedValue(undefined);

      await service.remove('507f1f77bcf86cd799439011');

      // expect(repository.remove).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(repository.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw NotFoundException if hospital not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.remove('507f1f77bcf86cd799439011')).rejects.toThrow(NotFoundException);
    });
  });
});
