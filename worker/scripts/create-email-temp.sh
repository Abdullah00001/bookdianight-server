#!/bin/bash
set -e

# Ensure a template name was provided
if [ -z "$1" ]; then
  echo "❌ Error: Please provide a template name (e.g., npm run create:emailTemp welcomeEmail)"
  exit 1
fi

TEMP_NAME=$1
TEMP_DIR="worker/src/app/templates"
TEMP_FILE="$TEMP_DIR/$TEMP_NAME.template.ts"

# Create the directory if it doesn't exist
mkdir -p "$TEMP_DIR"

# Check if file already exists
if [ -f "$TEMP_FILE" ]; then
  echo "❌ Error: Template '$TEMP_NAME' already exists at $TEMP_FILE"
  exit 1
fi

# Create the template file
cat > "$TEMP_FILE" <<EOF
const $TEMP_NAME = \`\`;

export default $TEMP_NAME;
EOF

echo "✅ Successfully created email template '$TEMP_NAME'!"
echo "   - $TEMP_FILE"
