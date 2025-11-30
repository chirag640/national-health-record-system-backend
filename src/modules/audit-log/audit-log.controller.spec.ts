import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogController } from './audit-log.controller';
import { AuditLogService } from './audit-log.service';

describe('AuditLogController', () => {
  let controller: AuditLogController;
  let service: jest.Mocked<AuditLogService>;

  const mockAuditLog = {
    _id: '507f1f77bcf86cd799439011',
    userId: 'test-userId',
    action: 'test-action',
    resource: 'test-resource',
    resourceId: 'test-resourceId',
    ipAddress: 'test-ipAddress',
    details: 'test-value',
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
      controllers: [AuditLogController],
      providers: [
        {
          provide: AuditLogService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AuditLogController>(AuditLogController);
    service = module.get(AuditLogService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a auditLog', async () => {
      const createDto = {
        userId: 'test-userId',
        action: 'test-action',
        resource: 'test-resource',
        resourceId: 'test-resourceId',
        ipAddress: 'test-ipAddress',
        details: 'test-value',
      };

      service.create.mockResolvedValue(mockAuditLog as any);

      const result = await controller.create(createDto as any);

      expect(result).toEqual(mockAuditLog);
      expect(service.create).toHaveBeenCalledWith(createDto);
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

      service.findAll.mockResolvedValue(mockResult as any);

      const result = await controller.findAll(1, 10);

      expect(result).toEqual(mockResult);
      expect(service.findAll).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('findOne', () => {
    it('should return a auditLog by id', async () => {
      service.findOne.mockResolvedValue(mockAuditLog as any);

      const result = await controller.findOne('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockAuditLog);
      expect(service.findOne).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });

  describe('update', () => {
    it('should update a auditLog', async () => {
      const updateDto = {};

      const updatedMock = { ...mockAuditLog, ...updateDto };
      service.update.mockResolvedValue(updatedMock as any);

      const result = await controller.update('507f1f77bcf86cd799439011', updateDto as any);

      expect(result).toEqual(updatedMock);
      expect(service.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', updateDto);
    });
  });

  describe('remove', () => {
    it('should remove a auditLog', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove('507f1f77bcf86cd799439011');

      expect(service.remove).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });
});
