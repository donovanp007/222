import { NextResponse } from 'next/server';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    filesystem: ServiceHealth;
    memory: ServiceHealth;
  };
  checks: HealthCheck[];
}

interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  message?: string;
  lastCheck: string;
}

interface HealthCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  duration: number;
}

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Verify health check token if provided
    const authHeader = new Headers().get('authorization');
    const healthToken = process.env.HEALTH_CHECK_TOKEN;
    
    if (healthToken && authHeader !== `Bearer ${healthToken}`) {
      // Still return basic health for unauthenticated requests
      return NextResponse.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        message: 'Service is running'
      }, { status: 200 });
    }

    const checks: HealthCheck[] = [];
    const services: HealthStatus['services'] = {
      database: { status: 'healthy', lastCheck: new Date().toISOString() },
      redis: { status: 'healthy', lastCheck: new Date().toISOString() },
      filesystem: { status: 'healthy', lastCheck: new Date().toISOString() },
      memory: { status: 'healthy', lastCheck: new Date().toISOString() }
    };

    // Check memory usage
    const memoryCheck = await checkMemoryUsage();
    checks.push(memoryCheck);
    services.memory = {
      status: memoryCheck.status === 'pass' ? 'healthy' : 
              memoryCheck.status === 'warn' ? 'degraded' : 'unhealthy',
      message: memoryCheck.message,
      lastCheck: new Date().toISOString()
    };

    // Check filesystem
    const filesystemCheck = await checkFilesystem();
    checks.push(filesystemCheck);
    services.filesystem = {
      status: filesystemCheck.status === 'pass' ? 'healthy' : 
              filesystemCheck.status === 'warn' ? 'degraded' : 'unhealthy',
      message: filesystemCheck.message,
      lastCheck: new Date().toISOString()
    };

    // Check database connectivity (if using external DB)
    const databaseCheck = await checkDatabase();
    checks.push(databaseCheck);
    services.database = {
      status: databaseCheck.status === 'pass' ? 'healthy' : 
              databaseCheck.status === 'warn' ? 'degraded' : 'unhealthy',
      message: databaseCheck.message,
      responseTime: databaseCheck.duration,
      lastCheck: new Date().toISOString()
    };

    // Check Redis connectivity (if using external Redis)
    const redisCheck = await checkRedis();
    checks.push(redisCheck);
    services.redis = {
      status: redisCheck.status === 'pass' ? 'healthy' : 
              redisCheck.status === 'warn' ? 'degraded' : 'unhealthy',
      message: redisCheck.message,
      responseTime: redisCheck.duration,
      lastCheck: new Date().toISOString()
    };

    // Determine overall status
    const hasFailures = checks.some(check => check.status === 'fail');
    const hasWarnings = checks.some(check => check.status === 'warn');
    
    const overallStatus: HealthStatus['status'] = 
      hasFailures ? 'unhealthy' : 
      hasWarnings ? 'degraded' : 'healthy';

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services,
      checks
    };

    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;

    return NextResponse.json(healthStatus, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      error: error instanceof Error ? error.message : 'Unknown error',
      checks: [{
        name: 'health_check_execution',
        status: 'fail',
        message: `Health check execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime
      }]
    }, { status: 503 });
  }
}

async function checkMemoryUsage(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const rssMB = Math.round(memUsage.rss / 1024 / 1024);
    
    // Define thresholds (in MB)
    const warningThreshold = 800;  // 800MB
    const criticalThreshold = 1500; // 1.5GB
    
    let status: 'pass' | 'warn' | 'fail' = 'pass';
    let message = `Memory usage: ${heapUsedMB}MB heap, ${rssMB}MB RSS`;
    
    if (heapUsedMB > criticalThreshold || rssMB > criticalThreshold) {
      status = 'fail';
      message += ' - CRITICAL: Memory usage is very high';
    } else if (heapUsedMB > warningThreshold || rssMB > warningThreshold) {
      status = 'warn';
      message += ' - WARNING: Memory usage is elevated';
    }
    
    return {
      name: 'memory_usage',
      status,
      message,
      duration: Date.now() - startTime
    };
  } catch (error) {
    return {
      name: 'memory_usage',
      status: 'fail',
      message: `Failed to check memory usage: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime
    };
  }
}

async function checkFilesystem(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    // Check if we can write to the temp directory
    const tempFile = path.join(process.cwd(), 'temp-health-check.txt');
    const testData = `Health check - ${new Date().toISOString()}`;
    
    await fs.writeFile(tempFile, testData);
    const readData = await fs.readFile(tempFile, 'utf8');
    await fs.unlink(tempFile);
    
    if (readData === testData) {
      return {
        name: 'filesystem_access',
        status: 'pass',
        message: 'Filesystem read/write operations successful',
        duration: Date.now() - startTime
      };
    } else {
      return {
        name: 'filesystem_access',
        status: 'fail',
        message: 'Filesystem data integrity check failed',
        duration: Date.now() - startTime
      };
    }
  } catch (error) {
    return {
      name: 'filesystem_access',
      status: 'fail',
      message: `Filesystem check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime
    };
  }
}

async function checkDatabase(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    // For localStorage-based storage in current implementation
    if (typeof window !== 'undefined') {
      // Client-side check
      const testKey = 'health-check-test';
      const testValue = 'test-data';
      
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      if (retrieved === testValue) {
        return {
          name: 'local_storage',
          status: 'pass',
          message: 'Local storage is accessible',
          duration: Date.now() - startTime
        };
      } else {
        return {
          name: 'local_storage',
          status: 'fail',
          message: 'Local storage data integrity check failed',
          duration: Date.now() - startTime
        };
      }
    } else {
      // Server-side - simulate database check
      // In a real implementation, you would check your actual database connection
      return {
        name: 'database_simulation',
        status: 'pass',
        message: 'Database simulation check passed (localStorage-based)',
        duration: Date.now() - startTime
      };
    }
  } catch (error) {
    return {
      name: 'database_check',
      status: 'fail',
      message: `Database check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime
    };
  }
}

async function checkRedis(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    // For current localStorage implementation, simulate Redis check
    // In a real implementation, you would ping your Redis instance
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      return {
        name: 'redis_config',
        status: 'warn',
        message: 'Redis URL not configured (using localStorage)',
        duration: Date.now() - startTime
      };
    }
    
    // Simulate Redis ping
    // const redis = new Redis(redisUrl);
    // await redis.ping();
    
    return {
      name: 'redis_simulation',
      status: 'pass',
      message: 'Redis simulation check passed (localStorage-based)',
      duration: Date.now() - startTime
    };
  } catch (error) {
    return {
      name: 'redis_check',
      status: 'fail',
      message: `Redis check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime
    };
  }
}

// Additional endpoint for simple ping check
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}