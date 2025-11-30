import { Test, TestingModule } from '@nestjs/testing';
import { HealthDocumentController } from './health-document.controller';
import { HealthDocumentService } from './health-document.service';

describe('HealthDocumentController', () => {
  let controller: HealthDocumentController;
  let service: jest.Mocked<HealthDocumentService>;

  const mockHealthDocument = {
    _id: '507f1f77bcf86cd799439011',
    docType: 'test-docType',
    fileUrl: 'test-fileUrl',
    metadata: 'test-value',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthDocumentController],
      providers: [
        {
          provide: HealthDocumentService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<HealthDocumentController>(HealthDocumentController);
    service = module.get(HealthDocumentService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a healthDocument', async () => {
      const createDto = {
        docType: 'test-docType',
        fileUrl: 'test-fileUrl',
        metadata: 'test-value',
      };

      service.create.mockResolvedValue(mockHealthDocument as any);

      const result = await controller.create(createDto as any);

      expect(result).toEqual(mockHealthDocument);
      expect(service.create).toHaveBeenCalledWith(createDto);
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

      service.findAll.mockResolvedValue(mockResult as any);

      const result = await controller.findAll(1, 10);

      expect(result).toEqual(mockResult);
      expect(service.findAll).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('findOne', () => {
    it('should return a healthDocument by id', async () => {
      service.findOne.mockResolvedValue(mockHealthDocument as any);

      const result = await controller.findOne('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockHealthDocument);
      expect(service.findOne).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });

  describe('update', () => {
    it('should update a healthDocument', async () => {
      const updateDto = {};

      const updatedMock = { ...mockHealthDocument, ...updateDto };
      service.update.mockResolvedValue(updatedMock as any);

      const result = await controller.update('507f1f77bcf86cd799439011', updateDto as any);

      expect(result).toEqual(updatedMock);
      expect(service.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', updateDto);
    });
  });

  describe('remove', () => {
    it('should remove a healthDocument', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove('507f1f77bcf86cd799439011');

      expect(service.remove).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });
});
