#!/bin/bash

echo "========================================"
echo "  ARE Public Gallery: Publishing..."
echo "========================================"

echo "[1/3] Running gallery update script..."
node update_gallery.js

if [ $? -ne 0 ]; then
    echo "[ERROR] update_gallery.js failed."
    exit 1
fi

echo "[2/3] Staging and Committing changes..."
git add .
git commit -m "Auto update gallery: $(date)"

echo "[3/3] Pushing to GitHub..."
git push origin main

echo "========================================"
echo "  Done! Your gallery is now live."
echo "========================================"
