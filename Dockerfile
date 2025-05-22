# Stage 1: Build the application (using a small, efficient Node.js image)
FROM node:20-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if you have one)
# This allows npm to install dependencies in a separate layer,
# which can be cached and speed up subsequent builds if your package.json doesn't change.
COPY package*.json ./

# Install project dependencies
# The --omit=dev flag prevents devDependencies from being installed in the production image
RUN npm install --omit=dev

# Copy the rest of your application code
COPY . .

# Stage 2: Create the final production image
# Use a lean Node.js image for the final production container
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy only the installed dependencies from the builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy the application code from the builder stage
COPY --from=builder /app .

# Expose the port your application listens on
# Ensure this matches the 'port' variable in your index.js (e.g., 3000)
EXPOSE 3000

# Define the command to run your application when the container starts
# This should match your "start" script in package.json
CMD [ "npm", "start" ]