# Use Debian-based image to avoid musl-related native binary issues
FROM node:22

WORKDIR /app

# Install only production dependencies
COPY package*.json ./

RUN npm ci

# Copy the rest of the project
COPY . .
# Build the Next.js app
#RUN npm run build

EXPOSE 3000

# Run the production server
CMD ["npm", "run", "dev"]