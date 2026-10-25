#!/bin/bash

# 🚀 Keycloak Custom Theme Production Deployment Script

set -e  # Exit on any error

echo "🎯 Keycloak Custom Theme Production Deployment"
echo "============================================="

# Configuration
THEME_NAME="custom-theme"
PRODUCTION_SERVER=""
KEYCLOAK_USER="keycloak"
KEYCLOAK_PATH="/opt/keycloak"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if production server is set
if [ -z "$PRODUCTION_SERVER" ]; then
    print_error "Please set PRODUCTION_SERVER variable in this script"
    echo "Example: PRODUCTION_SERVER='user@production-server.com'"
    exit 1
fi

# Check if theme directory exists
if [ ! -d "themes/$THEME_NAME" ]; then
    print_error "Theme directory 'themes/$THEME_NAME' not found"
    exit 1
fi

print_status "Starting deployment process..."

# Step 1: Create deployment package
print_status "Creating deployment package..."
cd themes/
tar -czf ${THEME_NAME}.tar.gz $THEME_NAME/
cd ..

# Step 2: Upload to production server
print_status "Uploading theme to production server..."
scp themes/${THEME_NAME}.tar.gz ${PRODUCTION_SERVER}:/tmp/

# Step 3: Deploy on production server
print_status "Deploying theme on production server..."
ssh ${PRODUCTION_SERVER} << EOF
    set -e
    echo "📦 Extracting theme files..."
    cd /tmp
    tar -xzf ${THEME_NAME}.tar.gz
    
    echo "🔧 Setting up theme directory..."
    sudo mkdir -p ${KEYCLOAK_PATH}/themes/
    sudo rm -rf ${KEYCLOAK_PATH}/themes/${THEME_NAME}
    sudo mv ${THEME_NAME} ${KEYCLOAK_PATH}/themes/
    
    echo "🔐 Setting permissions..."
    sudo chown -R ${KEYCLOAK_USER}:${KEYCLOAK_USER} ${KEYCLOAK_PATH}/themes/${THEME_NAME}
    sudo chmod -R 755 ${KEYCLOAK_PATH}/themes/${THEME_NAME}
    
    echo "🧹 Cleaning up..."
    rm -f /tmp/${THEME_NAME}.tar.gz
    
    echo "✅ Theme deployed successfully!"
EOF

# Step 4: Restart Keycloak (optional)
print_warning "Manual step required:"
echo "1. Login to Keycloak Admin Console"
echo "2. Go to Realm Settings → Themes"
echo "3. Set Login Theme to: custom.v2"
echo "4. Click Save"
echo "5. Restart Keycloak service if needed"

print_status "Deployment completed!"
print_status "Theme location: ${KEYCLOAK_PATH}/themes/${THEME_NAME}"

# Cleanup local files
rm -f themes/${THEME_NAME}.tar.gz

echo ""
echo "🧪 Test with:"
echo "https://your-keycloak-domain/realms/YOUR_REALM/account?error=cancelledOnApp"
echo ""
echo "Should redirect to:"
echo "https://app.valura.co.in/auth?error_code=CANCELLED_ON_APP&source=template_direct"