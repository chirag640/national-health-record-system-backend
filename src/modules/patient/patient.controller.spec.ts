import { Test, TestingModule } from '@nestjs/testing';
import { PatientController } from './patient.controller';
import { PatientService } from './patient.service';

describe('PatientController', () => {
  let controller: PatientController;
  let service: jest.Mocked<PatientService>;

  const mockPatient = {
    _id: '507f1f77bcf86cd799439011',
    guid: 'test-guid',
    fullName: 'test-fullName',
    phone: 'test-phone',
    gender: 'test-value',
    dateOfBirth: new Date(),
    address: 'test-value',
    allergies: 'test-value',
    chronicDiseases: 'test-value',
    bloodGroup: 'test-bloodGroup',
    emergencyContact: 'test-value',
    hasSmartphone: true,
    idCardIssued: true,
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
      controllers: [PatientController],
      providers: [
        {
          provide: PatientService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<PatientController>(PatientController);
    service = module.get(PatientService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a patient', async () => {
      const createDto = {
        guid: 'test-guid',
        fullName: 'test-fullName',
        phone: 'test-phone',
        gender: 'test-value',
        dateOfBirth: new Date(),
        address: 'test-value',
        allergies: 'test-value',
        chronicDiseases: 'test-value',
        bloodGroup: 'test-bloodGroup',
        emergencyContact: 'test-value',
        hasSmartphone: true,
        idCardIssued: true,
      };

      service.create.mockResolvedValue(mockPatient as any);

      const result = await controller.create(createDto as any);

      expect(result).toEqual(mockPatient);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated patients', async () => {
      const mockResult = {
        items: [mockPatient],
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
    it('should return a patient by id', async () => {
      service.findOne.mockResolvedValue(mockPatient as any);

      const result = await controller.findOne('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockPatient);
      expect(service.findOne).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });

  describe('update', () => {
    it('should update a patient', async () => {
      const updateDto = {};

      const updatedMock = { ...mockPatient, ...updateDto };
      service.update.mockResolvedValue(updatedMock as any);

      const result = await controller.update('507f1f77bcf86cd799439011', updateDto as any);

      expect(result).toEqual(updatedMock);
      expect(service.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', updateDto);
    });
  });

  describe('remove', () => {
    it('should remove a patient', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove('507f1f77bcf86cd799439011');

      expect(service.remove).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });
});
