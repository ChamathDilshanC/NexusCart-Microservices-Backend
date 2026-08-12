# Azure Deployment Guide for NexusCart Microservices

This guide provides a comprehensive step-by-step approach to deploying the NexusCart microservices backend to **Microsoft Azure**. 

Given that this is a multi-service architecture (8 microservices + 1 API Gateway) that communicates internally over HTTP, the best and most modern service to use on Azure is **Azure Container Apps (ACA)**. ACA is a fully managed serverless container service designed specifically for microservices.

---

## 🏗️ Architecture Overview on Azure

1. **Azure Container Registry (ACR)**: Stores the Docker images for all your microservices.
2. **Azure Container Apps (ACA)**: Hosts your microservices.
   - **API Gateway**: Deployed with **Public Ingress** enabled (Accessible from the internet).
   - **Microservices** (Auth, Business, Product, etc.): Deployed with **Internal Ingress** enabled (Only accessible by the API Gateway and other internal services).
3. **Azure Cosmos DB** (or Azure Database for MongoDB): A fully managed MongoDB-compatible database to replace your local database.

---

## Step 1: Prerequisites

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop).
2. Install the [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli).
3. Login to your Azure account:
   ```bash
   az login
   ```

## Step 2: Containerize the Microservices

Before deploying to Azure, every microservice needs a `Dockerfile`. You will need to create a `Dockerfile` in the root of **each** of the 9 directories (8 services + 1 gateway).

Here is a standard `Dockerfile` you can use for all of them:

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build  # Assuming you have a build script for TS, otherwise run ts-node
EXPOSE 5000 
CMD ["npm", "start"]
```
*(Make sure to adjust the `EXPOSE` port to match the port of the specific microservice).*

## Step 3: Create an Azure Container Registry (ACR)

We need a private registry on Azure to hold our Docker images.

```bash
# Create a Resource Group
az group create --name NexusCart-RG --location eastus

# Create the Container Registry
az acr create --resource-group NexusCart-RG --name nexuscartacr --sku Basic

# Log in to your ACR
az acr login --name nexuscartacr
```

## Step 4: Build and Push Images to ACR

For **each** microservice, build the Docker image and push it to your newly created Azure Container Registry.

Example for the API Gateway:
```bash
cd api-gateway
docker build -t nexuscartacr.azurecr.io/api-gateway:latest .
docker push nexuscartacr.azurecr.io/api-gateway:latest
cd ..
```
*(Repeat this for `auth-service`, `business-service`, `product-service`, etc.)*

## Step 5: Provision a Managed MongoDB Database

Instead of running MongoDB locally, use Azure's Cosmos DB for MongoDB.

1. Go to the Azure Portal -> Create a resource -> **Azure Cosmos DB**.
2. Select **Azure Cosmos DB for MongoDB**.
3. Create the database in the `NexusCart-RG` resource group.
4. Once deployed, go to **Connection String** and copy your Primary Connection String.

## Step 6: Create the Azure Container Apps Environment

The ACA Environment provides a secure virtual network for your microservices to communicate with each other.

```bash
az containerapp env create \
  --name nexuscart-env \
  --resource-group NexusCart-RG \
  --location eastus
```

## Step 7: Deploy the Internal Microservices

Deploy the 8 microservices (Auth, Business, Product, etc.) so they are **only** accessible internally. 

Example for `auth-service`:
```bash
az containerapp create \
  --name auth-service \
  --resource-group NexusCart-RG \
  --environment nexuscart-env \
  --image nexuscartacr.azurecr.io/auth-service:latest \
  --target-port 5001 \
  --ingress internal \
  --registry-server nexuscartacr.azurecr.io \
  --env-vars MONGO_URI="<your_cosmosdb_connection_string>" JWT_SECRET="<your_jwt_secret>"
```
*(Repeat this for the other 7 microservices, changing the `--name`, `--image`, and `--target-port` accordingly).*

### 🔗 Internal Communication (Crucial Step)
When deployed internally in Azure Container Apps, your services will be given an internal FQDN (Fully Qualified Domain Name). 
Currently, your services communicate using `http://127.0.0.1:5002`. In Azure, you must update your `axios` calls to use the ACA internal domain name, which looks like this:
`http://auth-service.internal.<unique-id>.eastus.azurecontainerapps.io`

*Tip: You should use environment variables in your code (e.g., `process.env.AUTH_SERVICE_URL`) instead of hardcoding localhost.*

## Step 8: Deploy the API Gateway (Public)

Finally, deploy the API Gateway. This is the **only** service that will have public internet access.

```bash
az containerapp create \
  --name api-gateway \
  --resource-group NexusCart-RG \
  --environment nexuscart-env \
  --image nexuscartacr.azurecr.io/api-gateway:latest \
  --target-port 5000 \
  --ingress external \
  --registry-server nexuscartacr.azurecr.io
```

Notice that `--ingress` is set to `external`. This will generate a public URL (e.g., `https://api-gateway.<unique-id>.eastus.azurecontainerapps.io`) that your frontend React/Next.js application can call.

## Step 9: Configure CORS

Make sure the API Gateway has CORS configured to allow requests from your frontend application domain (e.g., your Vercel or Azure Static Web Apps URL).

## Summary
You have successfully deployed a highly scalable, secure microservices architecture. The API Gateway acts as the public entry point, routing requests securely to your internal microservices over a private Azure virtual network.
