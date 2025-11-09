/**
 * Common API types and interfaces
 * Centralized type definitions for API requests and responses
 */

// Generic API Response
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success: boolean;
  status: number;
  timestamp?: string;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

// Pagination
export interface PaginationParams extends Record<string, unknown> {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Common Entity Types
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// User related types
export interface User extends BaseEntity {
  documentId: string;
  username: string;
  email: string;
  provider: string;
  confirmed: boolean;
  blocked: boolean;
  publishedAt: string;
  lastLoginTimestamp?: string;
  role: UserRole;
  createdVehicles: unknown[];
  updatedVehicles: unknown[];
  createdTrips: unknown[];
  updatedTrips: unknown[];
  driver: unknown;
  staff: unknown;
}

export interface UserRole {
  id: number;
  documentId: string;
  name: string;
  description: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}


// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// Vehicle related types
export interface Vehicle extends BaseEntity {
  documentId: string;
  vehicleNumber: string;
  model: string;
  type: VehicleType;
  currentStatus: VehicleCurrentStatus | string;
  isActive: boolean | null;
  publishedAt: string;
  // New fields
  odometerReading?: string;
  engineNumber?: string;
  chassisNumber?: string;
  typeOfVehicleAxle?: string;
  // Mandatory date fields
  registrationDate?: string;
  fitnessDate?: string;
  insuranceDate?: string;
  taxDueDate?: string;
  permitDate?: string;
  puccDate?: string;
  npValidUpto?: string;
  cstmCreatedBy?: string | User;
  cstmUpdatedBy?: string | User | User[];
  trips?: string[];
  garageLogs?: string[];
  tyreLogs?: string[];
  lastUpdatedBy?: string | User | null;
}

export enum VehicleType {
  TRUCK = 'truck',
  // CAR = 'car',
  // VAN = 'van',
  // BUS = 'bus',
  // MOTORCYCLE = 'motorcycle',
}

export enum VehicleCurrentStatus {
  CHOOSE_HERE = 'choose_here',
  IDLE = 'idle',
  ASSIGNED = 'assigned',
  ONGOING = 'ongoing',
  IN_TRANSIT = 'in-transit',
}

export interface VehicleCreateRequest {
  vehicleNumber: string;
  model: string;
  type: VehicleType;
  currentStatus: VehicleCurrentStatus | string;
  isActive: boolean;
  // New mandatory fields
  odometerReading: string;
  engineNumber: string;
  chassisNumber: string;
  typeOfVehicleAxle: string;
  // Mandatory date fields
  registrationDate: string;
  fitnessDate: string;
  insuranceDate: string;
  taxDueDate: string;
  permitDate: string;
  puccDate: string;
  npValidUpto: string;
  cstmCreatedBy?: string;
  cstmUpdatedBy?: string;
  trips?: string[];
}

export interface VehicleUpdateRequest extends Partial<VehicleCreateRequest> {
  id?: string;
  isActive?: boolean;
}

// Trip related types (old interface - removed)


// Expense related types
export interface Expense extends BaseEntity {
  tripId?: string;
  vehicleId?: string;
  driverId: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  receiptUrl?: string;
  date: string;
  status: ExpenseStatus;
  approvedBy?: string;
  approvedAt?: string;
  trip?: Trip;
  vehicle?: Vehicle;
  driver?: User;
}

export enum ExpenseCategory {
  FUEL = 'fuel',
  MAINTENANCE = 'maintenance',
  TOLLS = 'tolls',
  PARKING = 'parking',
  MEALS = 'meals',
  ACCOMMODATION = 'accommodation',
  OTHER = 'other',
}

export enum ExpenseStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

// Staff related types
export interface Staff extends BaseEntity {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  hireDate: string;
  salary?: number;
  isActive: boolean;
  managerId?: string;
  manager?: Staff;
}

// Common API Error types
export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: unknown;
  field?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ApiErrorResponse {
  message: string;
  errors?: ValidationError[];
  code?: string;
  status: number;
}

// Search and Filter types
export interface SearchParams {
  query?: string;
  filters?: Record<string, unknown>;
  pagination?: PaginationParams;
}

export interface DateRange extends Record<string, unknown> {
  startDate: string;
  endDate: string;
}

// File upload types
export interface FileUpload {
  file: File;
  category?: string;
  description?: string;
}

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

// Driver related types
export interface Driver extends BaseEntity {
  documentId: string;
  fullName: string;
  countryDialCode: string;
  contactNumber: string;
  emgCountryDialCode: string;
  emgContactNumber: string;
  aadhaarNumber: string;
  panNumber?: string;
  address: string;
  reference?: string;
  publishedAt: string;
  isActive?: boolean;
  licenseNumber?: string;
  licenseExpiry?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  // New fields
  currentStatus?: string | null;
  drivingLicenceNumber?: string | null;
  accountHolderName?: string | null;
  accountNumber?: string | null;
  branchName?: string | null;
  ifscCode?: string | null;
  accountType?: string | null;
  cstmCreatedBy?: string | User;
  cstmUpdatedBy?: string | User | User[];
  lastUpdatedBy?: string | User | null;
  user?: User;
  trips?: Trip[];
}

export interface DriverCreateRequest {
  fullName: string;
  countryDialCode: string;
  contactNumber: string;
  emgCountryDialCode: string;
  emgContactNumber: string;
  aadhaarNumber: string;
  panNumber?: string;
  address: string;
  reference?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  // New fields
  currentStatus?: string;
  drivingLicenceNumber?: string;
  accountHolderName?: string;
  accountNumber?: string;
  branchName?: string;
  ifscCode?: string;
  accountType?: string;
  // User creation fields
  username: string;
  email: string;
  password: string;
  confirmed?: boolean;
  blocked?: boolean;
  role?: string;
  // Custom fields
  cstmCreatedBy?: string;
  cstmUpdatedBy?: string;
}

export interface DriverUpdateRequest extends Partial<DriverCreateRequest> {
  isActive?: boolean;
  // Custom fields
  cstmCreatedBy?: string;
  cstmUpdatedBy?: string;
}

// Staff types
export interface Staff extends BaseEntity {
  documentId: string;
  fullName: string;
  countryDialCode: string;
  contactNumber: string;
  publishedAt: string;
  cstmCreatedBy?: string | User;
  cstmUpdatedBy?: string | User | User[];
  user?: User;
}

export interface StaffCreateRequest {
  fullName: string;
  countryDialCode: string;
  contactNumber: string;
  // User creation fields
  username: string;
  email: string;
  password: string;
  confirmed?: boolean;
  blocked?: boolean;
  role?: string;
  // Custom fields
  cstmCreatedBy?: string;
  cstmUpdatedBy?: string;
}

export interface StaffUpdateRequest extends Partial<StaffCreateRequest> {
  id?: string;
  // Custom fields
  cstmCreatedBy?: string;
  cstmUpdatedBy?: string;
}

// Logistics Provider related types
export interface LogisticsProvider extends BaseEntity {
  documentId: string;
  name: string;
  contactNumber: string;
  email: string;
  address: string;
  isActive: boolean;
  publishedAt: string;
  cstmCreatedBy?: string;
  cstmUpdatedBy?: string;
}

export interface LogisticsProviderCreateRequest {
  name: string;
  contactNumber: string;
  email: string;
  address: string;
  isActive: boolean;
  cstmCreatedBy?: string;
  cstmUpdatedBy?: string;
}

export interface LogisticsProviderUpdateRequest extends Partial<LogisticsProviderCreateRequest> {
  id?: string;
}

// Touching Location type
export interface TouchingLocation {
  id?: number;
  name: string;
}

// Trip related types
export interface Trip extends BaseEntity {
  documentId: string;
  tripNumber: string;
  estimatedStartTime: string;
  estimatedEndTime: string;
  actualEndTime?: string | null;
  startPoint: string;
  endPoint: string;
  totalTripDistanceInKM: number;
  startPointCoords?: string | null;
  endPointCoords?: string | null;
  currentStatus: TripStatus;
  publishedAt: string;
  cstmCreatedBy?: string | User;
  cstmUpdatedBy?: string | User | User[];
  // New fields
  vendorCode?: string | null;
  vendorName?: string | null;
  totalTripTimeInMinutes?: number | null;
  freightTotalAmount?: number | null;
  advanceAmount?: number | null;
  isTouchingLocationAvailable?: boolean;
  touchingLocations?: TouchingLocation[];
  // Relations
  driver?: string | Driver;
  vehicle?: string | Vehicle;
  logisticsProvider?: string | LogisticsProvider;
}

export enum TripStatus {
  CREATED = 'created',
  IN_TRANSIT = 'in-transit',
  COMPLETED = 'completed',
}

export interface TripCreateRequest {
  tripNumber: string;
  estimatedStartTime: string;
  estimatedEndTime: string;
  actualEndTime?: string | null;
  startPoint: string;
  endPoint: string;
  totalTripDistanceInKM: number;
  startPointCoords?: string | null;
  endPointCoords?: string | null;
  currentStatus: TripStatus;
  driver?: string;
  vehicle?: string;
  logisticsProvider?: string;
  cstmCreatedBy?: string;
  cstmUpdatedBy?: string;
  // New fields
  vendorCode?: string | null;
  vendorName?: string | null;
  totalTripTimeInMinutes?: number | null;
  freightTotalAmount?: number | null;
  advanceAmount?: number | null;
  isTouchingLocationAvailable?: boolean;
  touchingLocations?: TouchingLocation[];
}

export interface TripUpdateRequest extends Partial<TripCreateRequest> {
  id?: string;
}

// Strapi API Response format
export interface StrapiResponse<T> {
  data: T[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

// Dashboard and Analytics types
export interface DashboardStats {
  totalVehicles: number;
  activeTrips: number;
  totalExpenses: number;
  monthlyExpenses: number;
  totalDrivers: number;
  activeDrivers: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }[];
}

// Notification types
export interface Notification extends BaseEntity {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  readAt?: string;
  actionUrl?: string;
}

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  TRIP_UPDATE = 'trip_update',
  EXPENSE_APPROVAL = 'expense_approval',
  MAINTENANCE_REMINDER = 'maintenance_reminder',
}

// Transaction types
export interface Transaction extends BaseEntity {
  documentId: string;
  transactionId: string;
  type: 'debit' | 'credit';
  amount: number;
  description: string;
  transactionStatus: 'success' | 'pending' | 'failed' | 'cancelled';
  currency: string;
  method: 'upi' | 'card' | 'wallet' | 'cash';
  trip?: {
    id: number;
    documentId: string;
    tripNumber: string;
    startPoint: string;
    endPoint: string;
    currentStatus: string;
    totalTripDistanceInKM: number;
    estimatedStartTime: string;
    estimatedEndTime: string;
    actualEndTime?: string | null;
    vendorCode?: string | null;
    vendorName?: string | null;
  };
  cstmCreatedBy?: User;
  cstmUpdatedBy?: User[];
  publishedAt: string;
}

export interface TransactionCreateRequest {
  transactionId: string;
  type: 'debit' | 'credit';
  amount: number;
  description: string;
  transactionStatus: 'success' | 'pending' | 'failed' | 'cancelled';
  currency: string;
  method: 'upi' | 'card' | 'wallet' | 'cash';
  trip?: string;
  cstmCreatedBy?: string;
  cstmUpdatedBy?: string;
}

export interface TransactionUpdateRequest extends Partial<TransactionCreateRequest> {
  id?: string;
}

// City related types
export interface FuelStation extends BaseEntity {
  documentId: string;
  name: string;
  publishedAt: string;
  isActive: boolean;
  city?: string | City | null;
  fuelLogs?: unknown[];
  cstmCreatedBy?: string | User | null;
  cstmUpdatedBy?: string | User | User[] | null;
  lastUpdatedBy?: string | User | null;
}

export interface Garage extends BaseEntity {
  documentId: string;
  name: string;
  publishedAt: string;
  isActive: boolean;
  city?: string | City | null;
  garageLogs?: unknown[];
  cstmCreatedBy?: string | User | null;
  cstmUpdatedBy?: string | User | User[] | null;
  lastUpdatedBy?: string | User | null;
}

export interface LoadProvider {
  id: number;
  documentId: string;
  name: string;
  shortName?: string;
  isActive: boolean;
  contactNumber?: string;
  countryDialCode?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface City extends BaseEntity {
  documentId: string;
  name: string;
  cityCode: string;
  state: string;
  stateCode: string;
  country: string;
  countryISOCode: string;
  publishedAt: string;
  fuelStations?: FuelStation[];
  garages?: Garage[];
  loadProviders?: LoadProvider[];
  cstmCreatedBy?: string | User;
  cstmUpdatedBy?: string | User | User[];
  lastUpdatedBy?: string | User | null;
}

// Log related types
export interface FuelLog extends BaseEntity {
  documentId: string;
  publishedAt: string;
  [key: string]: unknown;
}

export interface GarageLog extends BaseEntity {
  documentId: string;
  publishedAt: string;
  [key: string]: unknown;
}

export interface TollLog extends BaseEntity {
  documentId: string;
  publishedAt: string;
  [key: string]: unknown;
}

export interface TyreLog extends BaseEntity {
  documentId: string;
  publishedAt: string;
  [key: string]: unknown;
}