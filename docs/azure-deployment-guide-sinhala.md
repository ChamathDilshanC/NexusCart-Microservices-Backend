# NexusCart Microservices සඳහා Azure Deployment Guide (සිංහල)

මෙම මාර්ගෝපදේශය මඟින් NexusCart microservices backend එක **Microsoft Azure** වෙත deploy කරන ආකාරය පියවරෙන් පියවර විස්තර කෙරේ.

මෙය internal HTTP හරහා සන්නිවේදනය කරන multi-service architecture එකක් (microservices 8 + API Gateway 1) බැවින්, Azure හි භාවිතා කිරීමට වඩාත්ම සුදුසු සහ නවීනතම සේවාව වන්නේ **Azure Container Apps (ACA)** ය. ACA යනු microservices සඳහාම විශේෂයෙන් නිර්මාණය කරන ලද fully managed serverless container සේවාවකි.

---

## 🏗️ Azure හි Architecture එක පිළිබඳ දළ විශ්ලේෂණයක්

1. **Azure Container Registry (ACR)**: ඔබගේ සියලුම microservices වල Docker images ගබඩා කරයි.
2. **Azure Container Apps (ACA)**: ඔබගේ microservices host කරයි.
   - **API Gateway**: **Public Ingress** සක්‍රීය කර deploy කර ඇත (අන්තර්ජාලය හරහා පිවිසිය හැක).
   - **Microservices** (Auth, Business, Product, යනාදිය): **Internal Ingress** සක්‍රීය කර deploy කර ඇත (API Gateway සහ අනෙකුත් internal සේවාවන්ට පමණක් පිවිසිය හැක).
3. **Azure Cosmos DB** (හෝ Azure Database for MongoDB): ඔබගේ local database එක වෙනුවට භාවිතා කළ හැකි fully managed MongoDB-compatible database එකකි.

---

## පියවර 1: අවශ්‍ය මූලිකාංග (Prerequisites)

1. [Docker Desktop](https://www.docker.com/products/docker-desktop) install කරගන්න.
2. [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) install කරගන්න.
3. ඔබගේ Azure ගිණුමට login වන්න:
   ```bash
   az login
   ```

## පියවර 2: Microservices Containerize කිරීම

Azure වෙත deploy කිරීමට පෙර, සෑම microservice එකකටම `Dockerfile` එකක් අවශ්‍ය වේ. ඔබට directories 9 හිම (සේවා 8 + 1 gateway) root හි `Dockerfile` එකක් සෑදිය යුතුය.

සියල්ල සඳහාම භාවිතා කළ හැකි standard `Dockerfile` එකක් පහත දැක්වේ:

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build  # ඔබ සතුව TS සඳහා build script එකක් ඇතැයි උපකල්පනය කරයි, නැතහොත් ts-node run කරන්න
EXPOSE 5000 
CMD ["npm", "start"]
```
*(අදාළ microservice එකේ port එකට ගැලපෙන පරිදි `EXPOSE` port එක වෙනස් කිරීමට වග බලා ගන්න).*

## පියවර 3: Azure Container Registry (ACR) එකක් සෑදීම

අපගේ Docker images රඳවා ගැනීමට අපට Azure හි private registry එකක් අවශ්‍ය වේ.

```bash
# Resource Group එකක් සාදන්න
az group create --name NexusCart-RG --location eastus

# Container Registry එක සාදන්න
az acr create --resource-group NexusCart-RG --name nexuscartacr --sku Basic

# ඔබගේ ACR එකට Log in වන්න
az acr login --name nexuscartacr
```

## පියවර 4: Images Build කර ACR වෙත Push කිරීම

**සෑම** microservice එකක් සඳහාම, Docker image එක build කර ඔබ අලුතින් සෑදූ Azure Container Registry වෙත push කරන්න.

API Gateway සඳහා උදාහරණයක්:
```bash
cd api-gateway
docker build -t nexuscartacr.azurecr.io/api-gateway:latest .
docker push nexuscartacr.azurecr.io/api-gateway:latest
cd ..
```
*(`auth-service`, `business-service`, `product-service` යනාදිය සඳහාද මෙය නැවත කරන්න)*

## පියවර 5: Managed MongoDB Database එකක් ලබාගැනීම

Local හි MongoDB run කරනවා වෙනුවට, Azure හි Cosmos DB for MongoDB භාවිතා කරන්න.

1. Azure Portal වෙත යන්න -> Create a resource -> **Azure Cosmos DB**.
2. **Azure Cosmos DB for MongoDB** තෝරන්න.
3. `NexusCart-RG` resource group එක තුළ database එක සාදන්න.
4. Deploy වූ පසු, **Connection String** වෙත ගොස් ඔබගේ Primary Connection String එක copy කරගන්න.

## පියවර 6: Azure Container Apps Environment එක සෑදීම

ACA Environment එක මඟින් ඔබගේ microservices වලට එකිනෙකා සමඟ සන්නිවේදනය කිරීමට ආරක්ෂිත virtual network එකක් සපයයි.

```bash
az containerapp env create \
  --name nexuscart-env \
  --resource-group NexusCart-RG \
  --location eastus
```

## පියවර 7: Internal Microservices Deploy කිරීම

Microservices 8 (Auth, Business, Product, යනාදිය) **අභ්‍යන්තරව (internally) පමණක්** පිවිසිය හැකි ලෙස deploy කරන්න.

`auth-service` සඳහා උදාහරණයක්:
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
*(`--name`, `--image`, සහ `--target-port` වෙනස් කරමින් අනෙකුත් microservices 7 සඳහාද මෙය නැවත කරන්න).*

### 🔗 Internal Communication (අතිශය වැදගත් පියවර)
Azure Container Apps තුළ අභ්‍යන්තරව deploy කළ විට, ඔබගේ සේවාවන්ට internal FQDN (Fully Qualified Domain Name) එකක් ලබා දේ. 
දැනට, ඔබගේ සේවාවන් `http://127.0.0.1:5002` භාවිතයෙන් සන්නිවේදනය කරයි. Azure හිදී, ACA internal domain name එක භාවිතා කිරීමට ඔබගේ `axios` calls යාවත්කාලීන කළ යුතුය. එය මෙලෙස දිස්වේ:
`http://auth-service.internal.<unique-id>.eastus.azurecontainerapps.io`

*ඉඟිය: Hardcode කරන ලද localhost වෙනුවට ඔබගේ code එකේ environment variables භාවිතා කළ යුතුය (උදා: `process.env.AUTH_SERVICE_URL`).*

## පියවර 8: API Gateway Deploy කිරීම (Public)

අවසාන වශයෙන්, API Gateway එක deploy කරන්න. Public අන්තර්ජාල ප්‍රවේශය (internet access) ඇති **එකම** සේවාව මෙයයි.

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

මෙහි `--ingress` යන්න `external` ලෙස සකසා ඇති බව සලකන්න. මේ මඟින් ඔබගේ frontend React/Next.js application එකට call කළ හැකි public URL එකක් (උදා: `https://api-gateway.<unique-id>.eastus.azurecontainerapps.io`) ජනනය කරයි.

## පියවර 9: CORS Configure කිරීම

ඔබගේ frontend application domain එකෙන් (උදා: ඔබගේ Vercel හෝ Azure Static Web Apps URL එකෙන්) එන requests වලට ඉඩ දීමට API Gateway හි CORS configure කර ඇති බව තහවුරු කරගන්න.

## සාරාංශය
ඔබ දැන් ඉතා හොඳින් scale කළ හැකි, ආරක්ෂිත microservices architecture එකක් සාර්ථකව deploy කර ඇත. API Gateway එක public entry point එක ලෙස ක්‍රියා කරන අතර, private Azure virtual network එකක් හරහා ඔබගේ internal microservices වෙත ආරක්ෂිතව requests යොමු කරයි.
