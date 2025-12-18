/**
 * Vector3 - Immutable 3D vector for physics calculations
 * 
 * All operations return new Vector3 instances to ensure determinism.
 * Used for positions, velocities, directions, and forces throughout the arena system.
 */

export interface IVector3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export class Vector3 implements IVector3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;

  constructor(x: number = 0, y: number = 0, z: number = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  // Static constants
  static readonly ZERO = new Vector3(0, 0, 0);
  static readonly UP = new Vector3(0, 1, 0);
  static readonly DOWN = new Vector3(0, -1, 0);
  static readonly FORWARD = new Vector3(0, 0, 1);
  static readonly BACK = new Vector3(0, 0, -1);
  static readonly RIGHT = new Vector3(1, 0, 0);
  static readonly LEFT = new Vector3(-1, 0, 0);

  /**
   * Add two vectors component-wise
   */
  add(other: IVector3): Vector3 {
    return new Vector3(
      this.x + other.x,
      this.y + other.y,
      this.z + other.z
    );
  }

  /**
   * Subtract another vector from this one
   */
  subtract(other: IVector3): Vector3 {
    return new Vector3(
      this.x - other.x,
      this.y - other.y,
      this.z - other.z
    );
  }

  /**
   * Multiply vector by a scalar
   */
  scale(scalar: number): Vector3 {
    return new Vector3(
      this.x * scalar,
      this.y * scalar,
      this.z * scalar
    );
  }

  /**
   * Component-wise multiplication
   */
  multiply(other: IVector3): Vector3 {
    return new Vector3(
      this.x * other.x,
      this.y * other.y,
      this.z * other.z
    );
  }

  /**
   * Dot product of two vectors
   */
  dot(other: IVector3): number {
    return this.x * other.x + this.y * other.y + this.z * other.z;
  }

  /**
   * Cross product of two vectors
   */
  cross(other: IVector3): Vector3 {
    return new Vector3(
      this.y * other.z - this.z * other.y,
      this.z * other.x - this.x * other.z,
      this.x * other.y - this.y * other.x
    );
  }

  /**
   * Length/magnitude of the vector
   */
  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  /**
   * Squared magnitude (avoids sqrt for performance)
   */
  magnitudeSquared(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  /**
   * Returns unit vector in same direction, or ZERO if magnitude is near zero
   */
  normalize(): Vector3 {
    const mag = this.magnitude();
    if (mag < 0.0001) return Vector3.ZERO;
    return this.scale(1 / mag);
  }

  /**
   * Distance to another point
   */
  distanceTo(other: IVector3): number {
    return this.subtract(other).magnitude();
  }

  /**
   * Squared distance (avoids sqrt for performance)
   */
  distanceSquaredTo(other: IVector3): number {
    return this.subtract(other).magnitudeSquared();
  }

  /**
   * Linear interpolation between this and other
   * @param t Interpolation factor, clamped to [0, 1]
   */
  lerp(other: IVector3, t: number): Vector3 {
    const clamped = Math.max(0, Math.min(1, t));
    return new Vector3(
      this.x + (other.x - this.x) * clamped,
      this.y + (other.y - this.y) * clamped,
      this.z + (other.z - this.z) * clamped
    );
  }

  /**
   * Check equality within epsilon tolerance
   */
  equals(other: IVector3, epsilon: number = 0.0001): boolean {
    return (
      Math.abs(this.x - other.x) < epsilon &&
      Math.abs(this.y - other.y) < epsilon &&
      Math.abs(this.z - other.z) < epsilon
    );
  }

  /**
   * Negate all components
   */
  negate(): Vector3 {
    return new Vector3(-this.x, -this.y, -this.z);
  }

  /**
   * Clamp magnitude to max value
   */
  clampMagnitude(maxMagnitude: number): Vector3 {
    const mag = this.magnitude();
    if (mag <= maxMagnitude) return this;
    return this.normalize().scale(maxMagnitude);
  }

  /**
   * Project this vector onto another vector
   */
  projectOnto(other: IVector3): Vector3 {
    const otherMagSq = other.x * other.x + other.y * other.y + other.z * other.z;
    if (otherMagSq < 0.0001) return Vector3.ZERO;
    const dot = this.dot(other);
    const scalar = dot / otherMagSq;
    return new Vector3(other.x * scalar, other.y * scalar, other.z * scalar);
  }

  /**
   * Reflect this vector off a surface with given normal
   */
  reflect(normal: IVector3): Vector3 {
    const dot = this.dot(normal);
    return new Vector3(
      this.x - 2 * dot * normal.x,
      this.y - 2 * dot * normal.y,
      this.z - 2 * dot * normal.z
    );
  }

  /**
   * Convert to array [x, y, z]
   */
  toArray(): [number, number, number] {
    return [this.x, this.y, this.z];
  }

  /**
   * Create Vector3 from array
   */
  static fromArray(arr: [number, number, number]): Vector3 {
    return new Vector3(arr[0], arr[1], arr[2]);
  }

  /**
   * Create a copy of this vector
   */
  clone(): Vector3 {
    return new Vector3(this.x, this.y, this.z);
  }

  /**
   * Create vector with only horizontal components (x, z)
   */
  horizontal(): Vector3 {
    return new Vector3(this.x, 0, this.z);
  }

  /**
   * String representation for debugging
   */
  toString(): string {
    return `Vector3(${this.x.toFixed(4)}, ${this.y.toFixed(4)}, ${this.z.toFixed(4)})`;
  }
}
