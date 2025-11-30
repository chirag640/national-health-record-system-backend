import { Test, TestingModule } from '@nestjs/testing';
import { PatientService } from './patient.service';
import { PatientRepository } from './patient.repository';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('PatientService', () => {
  let service: PatientService;
  let repository: jest.Mocked<PatientRepository>;

  const mockPatient = {
    _id: '507f1f77bcf86cd799439011',
    guid: 'test-guid',
    fullName: 'test-fullName',
    phone: 'test-phone',
    gender: 'Male',
    dateOfBirth: new Date(),
    address: { test: 'data' },
    allergies: ['test'],
    chronicDiseases: ['test'],
    bloodGroup: 'test-bloodGroup',
    emergencyContact: { test: 'data' },
    hasSmartphone: true,
    idCardIssued: true,
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
      findByGuid: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientService,
        {
          provide: PatientRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PatientService>(PatientService);
    repository = module.get(PatientRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a patient successfully', async () => {
      const createDto = {
        guid: 'test-guid',
        fullName: 'test-fullName',
        phone: 'test-phone',
        gender: 'Male',
        dateOfBirth: new Date(),
        address: { test: 'data' },
        allergies: ['test'],
        chronicDiseases: ['test'],
        bloodGroup: 'test-bloodGroup',
        emergencyContact: { test: 'data' },
        hasSmartphone: true,
        idCardIssued: true,
      };

      repository.create.mockResolvedValue(mockPatient as any);

      const result = await service.create(createDto);

      expect(result).toEqual(mockPatient);
      expect(repository.create).toHaveBeenCalledWith(createDto);
    });

    it('should throw ConflictException if guid already exists', async () => {
      const createDto = {
        guid: 'test-guid',
        fullName: 'test-fullName',
        phone: 'test-phone',
        gender: 'Male',
        dateOfBirth: new Date(),
        address: { test: 'data' },
        allergies: ['test'],
        chronicDiseases: ['test'],
        bloodGroup: 'test-bloodGroup',
        emergencyContact: { test: 'data' },
        hasSmartphone: true,
        idCardIssued: true,
      };

      repository.findByGuid.mockResolvedValue(mockPatient as any);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      expect(repository.findByGuid).toHaveBeenCalledWith(createDto.guid);
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

      repository.findAll.mockResolvedValue(mockResult as any);

      const result = await service.findAll(1, 10);

      expect(result).toEqual(mockResult);
      expect(repository.findAll).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('findOne', () => {
    it('should return a patient by id', async () => {
      repository.findById.mockResolvedValue(mockPatient as any);

      const result = await service.findOne('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockPatient);
      expect(repository.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw NotFoundException if patient not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne('507f1f77bcf86cd799439011')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a patient successfully', async () => {
      const updateDto = {};

      const updatedMock = { ...mockPatient, ...updateDto };
      repository.findById.mockResolvedValue(mockPatient as any);
      repository.update.mockResolvedValue(updatedMock as any);

      const result = await service.update('507f1f77bcf86cd799439011', updateDto);

      expect(result).toEqual(updatedMock);
      expect(repository.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', updateDto);
    });

    it('should throw NotFoundException if patient not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.update('507f1f77bcf86cd799439011', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a patient successfully', async () => {
      repository.findById.mockResolvedValue(mockPatient as any);
      // repository.remove.mockResolvedValue(undefined);

      await service.remove('507f1f77bcf86cd799439011');

      // expect(repository.remove).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(repository.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw NotFoundException if patient not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.remove('507f1f77bcf86cd799439011')).rejects.toThrow(NotFoundException);
    });
  });
});
