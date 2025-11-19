#!/bin/bash

# Direct Database Check and Create Donation with Real Referral Code

echo "🔍 CHECKING EXISTING REFERRAL CODES IN DATABASE"
echo "==============================================="
echo ""

# Use MongoDB connection string to query
MONGODB_URI="mongodb+srv://ronakkumar20062006:6a3Z2VCGkXH0ZtL4@cluster0.969t4yr.mongodb.net/?appName=Cluster0"

print_success() { echo -e "\033[0;32m✅ $1\033[0m"; }
print_error() { echo -e "\033[0;31m❌ $1\033[0m"; }
print_info() { echo -e "\033[0;34mℹ️  $1\033[0m"; }
print_warning() { echo -e "\033[1;33m⚠️  $1\033[0m"; }

# Check if mongosh is available
if command -v mongosh &> /dev/null; then
    print_info "Fetching referral codes from database..."
    
    # Query referral codes
    CODES=$(mongosh "$MONGODB_URI" --quiet --eval '
        db.referral_codes.find({active: true}).limit(10).forEach(function(doc) {
            print(doc.code + "|" + doc.ownerUserId);
        });
    ')
    
    if [ ! -z "$CODES" ]; then
        print_success "Found referral codes:"
        echo "$CODES" | while IFS='|' read -r code userId; do
            echo "   • $code (User: $userId)"
        done
        
        # Get first code for testing
        FIRST_CODE=$(echo "$CODES" | head -1 | cut -d'|' -f1)
        FIRST_USER=$(echo "$CODES" | head -1 | cut -d'|' -f2)
        
        echo ""
        print_info "Using referral code: $FIRST_CODE"
        print_info "User ID: $FIRST_USER"
        echo ""
        
        # Get user details
        print_info "Fetching user hierarchy..."
        mongosh "$MONGODB_URI" --quiet --eval "
            var user = db.users.findOne({_id: ObjectId('$FIRST_USER')});
            if (user) {
                print('Name: ' + user.name);
                print('Role: ' + user.role);
                print('Email: ' + user.email);
                print('Commission Wallet: ₹' + (user.commission_wallet || 0));
                print('Parent ID: ' + (user.parentCoordinatorId || 'None'));
                
                // Get parent hierarchy
                var parents = [];
                var currentId = user.parentCoordinatorId;
                var level = 1;
                while (currentId && level <= 10) {
                    var parent = db.users.findOne({_id: ObjectId(currentId)});
                    if (parent) {
                        parents.push({level: level, name: parent.name, role: parent.role});
                        currentId = parent.parentCoordinatorId;
                        level++;
                    } else {
                        break;
                    }
                }
                
                if (parents.length > 0) {
                    print('\\nHierarchy Chain:');
                    parents.forEach(function(p) {
                        print('  Level ' + p.level + ': ' + p.name + ' (' + p.role + ')');
                    });
                } else {
                    print('\\nNo parent hierarchy (top-level user)');
                }
            }
        "
        
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        print_info "CREATING TEST DONATION WITH REFERRAL CODE"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        
        # Get program
        PROGRAM_ID=$(curl -s http://localhost:3000/api/programs | jq -r '.data.programs[0]._id' 2>/dev/null)
        
        if [ ! -z "$PROGRAM_ID" ] && [ "$PROGRAM_ID" != "null" ]; then
            print_success "Using program: $PROGRAM_ID"
            
            # Create donation order
            ORDER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/donations/create-order \
              -H "Content-Type: application/json" \
              -d '{
                "amount": 10000,
                "currency": "INR",
                "donorName": "Test Revenue Donor",
                "donorEmail": "test-revenue@example.com",
                "donorPhone": "9999999999",
                "programId": "'$PROGRAM_ID'",
                "referralCode": "'$FIRST_CODE'"
              }')
            
            echo ""
            print_info "Order Response:"
            echo "$ORDER_RESPONSE" | jq '.' 2>/dev/null || echo "$ORDER_RESPONSE"
            
            ORDER_ID=$(echo "$ORDER_RESPONSE" | jq -r '.orderId' 2>/dev/null)
            
            if [ ! -z "$ORDER_ID" ] && [ "$ORDER_ID" != "null" ]; then
                print_success "Donation order created with referral code!"
                echo ""
                print_warning "NEXT STEPS:"
                echo "1. Complete payment using Razorpay test mode"
                echo "2. After payment success, check commission distribution"
                echo ""
                print_info "Database queries to verify:"
                echo "   db.commission_logs.find({userId: ObjectId('$FIRST_USER')})"
                echo "   db.users.findOne({_id: ObjectId('$FIRST_USER')}, {name: 1, commission_wallet: 1})"
            fi
        fi
        
    else
        print_warning "No active referral codes found in database"
    fi
else
    print_warning "mongosh not found. Cannot query database directly."
    echo ""
    print_info "Manual steps:"
    echo "1. Connect to MongoDB using MongoDB Compass or mongosh"
    echo "2. Run: db.referral_codes.find({active: true})"
    echo "3. Copy a referral code and test with the test script"
fi

echo ""
print_success "Database check complete!"
