$ErrorActionPreference = "Stop"

# Create root package.json for concurrently
Set-Content -Path "package.json" -Value '{
  "name": "nexuscart-backend-microservices",
  "version": "1.0.0",
  "scripts": {
    "dev": "concurrently \"npm run dev:api\" \"npm run dev:auth\" \"npm run dev:business\" \"npm run dev:product\" \"npm run dev:admin\"",
    "dev:api": "cd api-gateway && npm run dev",
    "dev:auth": "cd auth-service && npm run dev",
    "dev:business": "cd business-service && npm run dev",
    "dev:product": "cd product-service && npm run dev",
    "dev:admin": "cd admin-service && npm run dev",
    "install:all": "npm install && cd api-gateway && npm install && cd ../auth-service && npm install && cd ../business-service && npm install && cd ../product-service && npm install && cd ../admin-service && npm install"
  },
  "dependencies": {
    "concurrently": "^8.2.2"
  }
}'

$services = @("auth-service", "business-service", "product-service", "admin-service")
foreach ($service in $services) {
    New-Item -ItemType Directory -Force -Path $service | Out-Null
    
    # package.json
    Set-Content -Path "$service/package.json" -Value "{
      `"name`": `"$service`",
      `"version`": `"1.0.0`",
      `"scripts`": {
        `"dev`": `"nodemon src/server.ts`"
      },
      `"dependencies`": {
        `"express`": `"^4.18.2`",
        `"mongoose`": `"^8.0.3`",
        `"dotenv`": `"^16.3.1`",
        `"cors`": `"^2.8.5`",
        `"bcrypt`": `"^5.1.1`",
        `"jsonwebtoken`": `"^9.0.2`",
        `"nodemailer`": `"^6.9.7`"
      },
      `"devDependencies`": {
        `"@types/express`": `"^4.17.21`",
        `"@types/node`": `"^20.10.4`",
        `"@types/bcrypt`": `"^5.0.2`",
        `"@types/jsonwebtoken`": `"^9.0.5`",
        `"@types/nodemailer`": `"^6.4.14`",
        `"@types/cors`": `"^2.8.17`",
        `"typescript`": `"^5.3.3`",
        `"ts-node`": `"^10.9.2`",
        `"nodemon`": `"^3.0.2`"
      }
    }"

    # tsconfig.json
    Copy-Item -Path "tsconfig.json" -Destination "$service/tsconfig.json"
    
    # Create src structure
    New-Item -ItemType Directory -Force -Path "$service/src" | Out-Null
    Copy-Item -Path "src/models" -Destination "$service/src" -Recurse
    Copy-Item -Path "src/utils" -Destination "$service/src" -Recurse
    Copy-Item -Path "src/middleware" -Destination "$service/src" -Recurse
    New-Item -ItemType Directory -Force -Path "$service/src/controllers" | Out-Null
    New-Item -ItemType Directory -Force -Path "$service/src/routes" | Out-Null
}

# API Gateway
New-Item -ItemType Directory -Force -Path "api-gateway" | Out-Null
Set-Content -Path "api-gateway/package.json" -Value '{
  "name": "api-gateway",
  "version": "1.0.0",
  "scripts": {
    "dev": "nodemon src/server.ts"
  },
  "dependencies": {
    "express": "^4.18.2",
    "http-proxy-middleware": "^2.0.6",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.4",
    "@types/cors": "^2.8.17",
    "typescript": "^5.3.3",
    "ts-node": "^10.9.2",
    "nodemon": "^3.0.2"
  }
}'
Copy-Item -Path "tsconfig.json" -Destination "api-gateway/tsconfig.json"

Write-Host "Scaffold complete."
