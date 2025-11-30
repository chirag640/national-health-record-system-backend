import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogService } from './audit-log.service';
import { AuditLogRepository } from './audit-log.repository';
import { NotFoundException } from '@nestjs/common';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let repository: jest.Mocked<AuditLogRepository>;

  const mockAuditLog = {
    _id: '507f1f77bcf86cd799439011',
    userId: 'test-userId',
    action: 'test-action',
    resource: 'test-resource',
    resourceId: 'test-resourceId',
    ipAddress: 'test-ipAddress',
    details: { test: 'data' },
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
        AuditLogService,
        {
          provide: AuditLogRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
    repository = module.get(AuditLogRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a auditLog successfully', async () => {
      const createDto = {
        userId: 'test-userId',
        action: 'test-action',
        resource: 'test-resource',
        resourceId: 'test-resourceId',
        ipAddress: 'test-ipAddress',
        details: { test: 'data' },
      };

      repository.create.mockResolvedValue(mockAuditLog as any);

      const result = await service.create(createDto);

      expect(result).toEqual(mockAuditLog);
      expect(repository.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated auditlogs', async () => {
      const mockResult = {
        items: [mockAuditLog],
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
    it('should return a auditLog by id', async () => {
      repository.findById.mockResolvedValue(mockAuditLog as any);

      const result = await service.findOne('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockAuditLog);
      expect(repository.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw NotFoundException if auditLog not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne('507f1f77bcf86cd799439011')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a auditLog successfully', async () => {
      const updateDto = {};

      const updatedMock = { ...mockAuditLog, ...updateDto };
      repository.findById.mockResolvedValue(mockAuditLog as any);
      repository.update.mockResolvedValue(updatedMock as any);

      const result = await service.update('507f1f77bcf86cd799439011', updateDto);

      expect(result).toEqual(updatedMock);
      expect(repository.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', updateDto);
    });

    it('should throw NotFoundException if auditLog not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.update('507f1f77bcf86cd799439011', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a auditLog successfully', async () => {
      repository.findById.mockResolvedValue(mockAuditLog as any);
      // repository.remove.mockResolvedValue(undefined);

      await service.remove('507f1f77bcf86cd799439011');

      // expect(repository.remove).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(repository.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw NotFoundException if auditLog not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.remove('507f1f77bcf86cd799439011')).rejects.toThrow(NotFoundException);
    });
  });
});
