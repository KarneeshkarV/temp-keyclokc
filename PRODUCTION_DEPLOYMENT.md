# 🚀 Production Deployment Guide - Keycloak Custom Theme

## 📋 Pre-Deployment Checklist

### 1. **Clean Up Debug Code**
Before production, remove debug scripts:

```bash
# Remove debug script from theme.properties
scripts=js/errorRedirect.js

# Update redirect URL in theme.properties
errorRedirect.url=https://app.valura.co.in/auth
errorRedirect.debug=false
```

### 2. **Test Final Configuration**
- ✅ Error redirect works with `cancelledOnApp`
- ✅ Redirects to `https://app.valura.co.in/auth`
- ✅ No console errors
- ✅ Theme loads correctly

---

## 🎯 Deployment Methods

### **Method 1: Docker Keycloak (Recommended)**

#### Option A: Volume Mount
```bash
# Copy theme to production server
scp -r themes/ user@production-server:/opt/keycloak/themes/

# Docker compose with theme mount
version: '3.8'
services:
  keycloak:
    image: quay.io/keycloak/keycloak:latest
    volumes:
      - ./themes:/opt/keycloak/themes
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
    command: start-dev
    ports:
      - "8080:8080"
```

#### Option B: Custom Docker Image
```dockerfile
FROM quay.io/keycloak/keycloak:latest

# Copy custom theme
COPY themes/ /opt/keycloak/themes/

# Set production mode
ENV KC_HOSTNAME_STRICT=false
ENV KC_HTTP_ENABLED=true

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
```

### **Method 2: Standalone Keycloak**

```bash
# 1. Copy theme files to production server
rsync -avz themes/ user@production-server:/opt/keycloak/themes/

# 2. Restart Keycloak service
sudo systemctl restart keycloak
# OR
sudo /opt/keycloak/bin/kc.sh stop
sudo /opt/keycloak/bin/kc.sh start --optimized
```

### **Method 3: JAR Deployment**

```bash
# 1. Create theme JAR
cd themes/
zip -r custom-theme.jar custom-theme/

# 2. Copy to deployments directory
scp custom-theme.jar user@production-server:/opt/keycloak/providers/

# 3. Restart Keycloak
sudo systemctl restart keycloak
```

---

## ⚙️ Production Configuration Steps

### **1. Upload Theme Files**
```bash
# Secure copy to production
scp -r themes/custom-theme user@production-server:/opt/keycloak/themes/
```

### **2. Set File Permissions**
```bash
# On production server
sudo chown -R keycloak:keycloak /opt/keycloak/themes/custom-theme
sudo chmod -R 755 /opt/keycloak/themes/custom-theme
```

### **3. Apply Theme in Admin Console**
1. Login to: `https://your-keycloak-domain/admin`
2. Go to: **Realm Settings → Themes**
3. Set **Login Theme**: `custom.v2`
4. Click **Save**

### **4. Test Production**
```bash
# Test URL with error
https://your-keycloak-domain/realms/YOUR_REALM/account?error=cancelledOnApp

# Should redirect to:
https://app.valura.co.in/auth?error_code=CANCELLED_ON_APP&source=template_direct
```

---

## 🔒 Security Considerations

### **1. Remove Debug Code**
```bash
# Remove from theme.properties
scripts=js/errorRedirect.js  # Remove debug-redirect.js

# Set production config
errorRedirect.debug=false
```

### **2. HTTPS Only**
```bash
# Ensure redirect URL is HTTPS
errorRedirect.url=https://app.valura.co.in/auth
```

### **3. Validate Redirect Domain**
Add domain validation in JavaScript:
```javascript
const allowedDomains = ['app.valura.co.in', 'valura.ai'];
const redirectDomain = new URL(redirectUrl).hostname;
if (!allowedDomains.includes(redirectDomain)) {
    console.error('Invalid redirect domain');
    return;
}
```

---

## 🚀 Quick Deployment Commands

### **For Docker Production:**
```bash
# 1. Copy theme
docker cp themes/ keycloak_container:/opt/keycloak/themes/

# 2. Restart container
docker restart keycloak_container
```

### **For Kubernetes:**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: keycloak-theme
data:
  # Include theme files here
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: keycloak
spec:
  template:
    spec:
      containers:
      - name: keycloak
        image: quay.io/keycloak/keycloak:latest
        volumeMounts:
        - name: theme-volume
          mountPath: /opt/keycloak/themes/custom-theme
      volumes:
      - name: theme-volume
        configMap:
          name: keycloak-theme
```

---

## 🔍 Troubleshooting Production

### **1. Theme Not Loading**
```bash
# Check file permissions
ls -la /opt/keycloak/themes/custom-theme/

# Check Keycloak logs
tail -f /opt/keycloak/logs/keycloak.log
```

### **2. JavaScript Errors**
```bash
# Enable browser console in production
errorRedirect.debug=true  # Temporarily
```

### **3. Redirect Not Working**
```bash
# Test direct URL
curl -I "https://your-domain/realms/realm/account?error=cancelledOnApp"
```

---

## 📝 Production Checklist

- [ ] Debug code removed
- [ ] HTTPS redirect URL configured
- [ ] File permissions set correctly
- [ ] Theme applied in admin console
- [ ] Tested error redirect functionality
- [ ] Keycloak service restarted
- [ ] SSL certificates valid
- [ ] Firewall rules configured
- [ ] Backup created before deployment

---

## 🆘 Rollback Plan

```bash
# 1. Revert theme in admin console
# Set Login Theme back to: keycloak

# 2. Remove custom theme files
sudo rm -rf /opt/keycloak/themes/custom-theme

# 3. Restart Keycloak
sudo systemctl restart keycloak
```

---

**🎯 Production URL Pattern:**
When `cancelledOnApp` error occurs → Redirects to: `https://app.valura.co.in/auth?error_code=CANCELLED_ON_APP&source=template_direct`