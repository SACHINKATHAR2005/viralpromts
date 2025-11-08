# Docker Commands for ViralPrompts Backend

## Build the Image
```bash
docker build -t viralprompts-backend .
```

## Run the Container (Development)
```bash
docker run -p 5000:5000 --env-file .env viralprompts-backend
```

## Run with Environment Variables
```bash
docker run -p 5000:5000 \
  -e MONGODB_URI=your_mongodb_uri \
  -e JWT_SECRET=your_jwt_secret \
  -e CLOUDINARY_CLOUD_NAME=your_cloud_name \
  -e CLOUDINARY_API_KEY=your_api_key \
  -e CLOUDINARY_API_SECRET=your_api_secret \
  viralprompts-backend
```

## View Running Containers
```bash
docker ps
```

## Stop Container
```bash
docker stop <container_id>
```

## View Logs
```bash
docker logs <container_id>
```

## Remove Container
```bash
docker rm <container_id>
```

## Remove Image
```bash
docker rmi viralprompts-backend
```
