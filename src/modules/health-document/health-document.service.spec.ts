import { Test, TestingModule } from '@nestjs/testing';
import { HealthDocumentService } from './health-document.service';
import { HealthDocumentRepository } from './health-document.repository';
import { NotFoundException } from '@nestjs/common';

describe('HealthDocumentService', () => {
  let service: HealthDocumentService;
  let repository: jest.Mocked<HealthDocumentRepository>;

  const mockHealthDocument = {
    _id: '507f1f77bcf86cd799439011',
    docType: 'test-docType',
    fileUrl: 'test-fileUrl',
    metadata: { test: 'data' },
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
        HealthDocumentService,
        {
          provide: HealthDocumentRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<HealthDocumentService>(HealthDocumentService);
    repository = module.get(HealthDocumentRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a healthDocument successfully', async () => {
      const createDto = {
        patientId: 'PATIENT-123',
        hospitalId: '507f1f77bcf86cd799439011',
        docType: 'test-docType',
        fileUrl: 'test-fileUrl',
        metadata: { test: 'data' },
      };

      repository.create.mockResolvedValue(mockHealthDocument as any);

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(repository.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated healthdocuments', async () => {
      const mockResult = {
        items: [mockHealthDocument],
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
    it('should return a healthDocument by id', async () => {
      repository.findById.mockResolvedValue(mockHealthDocument as any);

      const result = await service.findOne('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockHealthDocument);
      expect(repository.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw NotFoundException if healthDocument not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne('507f1f77bcf86cd799439011')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a healthDocument successfully', async () => {
      const updateDto = {};

      const updatedMock = { ...mockHealthDocument, ...updateDto };
      repository.findById.mockResolvedValue(mockHealthDocument as any);
      repository.update.mockResolvedValue(updatedMock as any);

      const result = await service.update('507f1f77bcf86cd799439011', updateDto);

      expect(result).toEqual(updatedMock);
      expect(repository.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', updateDto);
    });

    it('should throw NotFoundException if healthDocument not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.update('507f1f77bcf86cd799439011', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a healthDocument successfully', async () => {
      repository.findById.mockResolvedValue(mockHealthDocument as any);
      // repository.remove.mockResolvedValue(undefined);

      await service.remove('507f1f77bcf86cd799439011');

      // expect(repository.remove).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(repository.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw NotFoundException if healthDocument not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.remove('507f1f77bcf86cd799439011')).rejects.toThrow(NotFoundException);
    });
  });
});
