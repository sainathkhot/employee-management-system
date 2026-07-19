const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { Schema } = mongoose;

const ROLES = ['SUPER_ADMIN', 'HR_MANAGER', 'EMPLOYEE'];
const STATUSES = ['ACTIVE', 'INACTIVE'];

const employeeSchema = new Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      match: [/^\+?[0-9]{7,15}$/, 'Invalid phone number'],
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      trim: true,
    },
    salary: {
      type: Number,
      required: [true, 'Salary is required'],
      min: [0, 'Salary must be a positive number'],
    },
    joiningDate: {
      type: Date,
      required: [true, 'Joining date is required'],
    },
    status: {
      type: String,
      enum: STATUSES,
      default: 'ACTIVE',
    },
    role: {
      type: String,
      enum: ROLES,
      default: 'EMPLOYEE',
    },
    reportingManager: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    profileImage: {
      type: String,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
    deletedAt: {
      type: Date,
      default: null,
      select: false,
    },
    refreshTokenVersion: {
      type: Number,
      default: 0,
      select: false,
    },
  },
  { timestamps: true }
);

employeeSchema.index({ name: 'text', email: 'text' });
employeeSchema.index({ department: 1 });
employeeSchema.index({ status: 1 });
employeeSchema.index({ role: 1 });

// Exclude soft-deleted docs by default on find-family queries unless explicitly overridden
function excludeDeleted(next) {
  if (this.getFilter().includeDeleted) {
    delete this.getFilter().includeDeleted;
    return next();
  }
  if (!('isDeleted' in this.getFilter())) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
}
employeeSchema.pre(/^find/, excludeDeleted);

employeeSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

employeeSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

employeeSchema.methods.toSafeJSON = function toSafeJSON() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshTokenVersion;
  delete obj.isDeleted;
  delete obj.deletedAt;
  delete obj.__v;
  return obj;
};

// Fields an EMPLOYEE (self) is allowed to edit on their own profile
employeeSchema.statics.SELF_EDITABLE_FIELDS = ['phone', 'profileImage'];
employeeSchema.statics.ROLES = ROLES;
employeeSchema.statics.STATUSES = STATUSES;

module.exports = mongoose.model('Employee', employeeSchema);
