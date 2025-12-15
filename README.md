## Deploying to Azure App Service (Linux)

1. **Create an Azure Web App (Linux, Node 20):**
   - Use the Azure Portal or CLI to create a new Web App.
   - Choose Node 20 as the runtime stack.

2. **Configure App Settings:**
   - `NODE_ENV=production`
   - `DB_PATH=/home/data/data.db`
   - `WEBSITES_ENABLE_APP_SERVICE_STORAGE=true` (ensures /home is persistent)

3. **Deploy from GitHub:**
   - Connect your GitHub repo to the Azure Web App deployment center.
   - Push to your main branch to trigger deployment.

4. **Persistence:**
   - SQLite database will be stored at `/home/data/data.db` and will persist across restarts.

5. **Health Check:**
   - Azure can use `/health` for health monitoring.