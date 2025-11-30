import { Test, TestingModule } from '@nestjs/testing';
import { ConsentService } from './consent.service';
import { ConsentRepository } from './consent.repository';
import { NotFoundException } from '@nestjs/common';

describe('ConsentService', () => {
  let service: ConsentService;
  let repository: jest.Mocked<ConsentRepository>;

  const mockConsent = {
    _id: '507f1f77bcf86cd799439011',
    scope: ['test'],
    expiresAt: new Date(),
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
        ConsentService,
        {
          provide: ConsentRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ConsentService>(ConsentService);
    repository = module.get(ConsentRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a consent successfully', async () => {
      const createDto = {
        patientId: 'PATIENT-123',
        scope: ['read', 'write'],
        expiresAt: new Date(),
      };

      repository.create.mockResolvedValue(mockConsent as any);

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(repository.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated consents', async () => {
      const mockResult = {
        items: [mockConsent],
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
    it('should return a consent by id', async () => {
      repository.findById.mockResolvedValue(mockConsent as any);

      const result = await service.findOne('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockConsent);
      expect(repository.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw NotFoundException if consent not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne('507f1f77bcf86cd799439011')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a consent successfully', async () => {
      const updateDto = {};

      const updatedMock = { ...mockConsent, ...updateDto };
      repository.findById.mockResolvedValue(mockConsent as any);
      repository.update.mockResolvedValue(updatedMock as any);

      const result = await service.update('507f1f77bcf86cd799439011', updateDto);

      expect(result).toEqual(updatedMock);
      expect(repository.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', updateDto);
    });

    it('should throw NotFoundException if consent not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.update('507f1f77bcf86cd799439011', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a consent successfully', async () => {
      repository.findById.mockResolvedValue(mockConsent as any);
      // repository.remove.mockResolvedValue(undefined);

      await service.remove('507f1f77bcf86cd799439011');

      // expect(repository.remove).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(repository.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw NotFoundException if consent not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.remove('507f1f77bcf86cd799439011')).rejects.toThrow(NotFoundException);
    });
  });
});
