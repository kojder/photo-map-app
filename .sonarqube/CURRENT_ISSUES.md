# SonarQube Issues - photo-map-app

**Last Updated:** 2025-10-30  
**Project:** Backend (kojder_photo-map-app-backend)  
**Total OPEN Issues (Backend):** 9 (was 17 before fixes)  
**CRITICAL Issues Fixed:** 8 ✅

## Summary

| Severity | Count | Status |
|----------|-------|--------|
| CRITICAL | 0 | ✅ All Fixed |
| MAJOR | 9 | Remaining (not blocking) |

**Total effort saved:** ~49 minutes (all CRITICAL issues fixed)

## ✅ Fixed CRITICAL Issues (2025-10-30)

All 8 CRITICAL issues have been successfully resolved:

1. ✅ Duplicate string literal "Photo not found or access denied" → Created constant in PhotoController
2. ✅ Duplicate string literal "User not found" → Created constant in UserService
3. ✅ Transactional method call via 'this' (UserService) → Removed overloaded method
4. ✅ Static access for TAG_DATETIME_ORIGINAL → Changed to ExifDirectoryBase.TAG_DATETIME_ORIGINAL
5. ✅ Transactional method call via 'this' (SettingsService line 47) → Removed wrapper methods
6. ✅ Transactional method call via 'this' (SettingsService line 42) → Removed wrapper methods
7. ✅ Empty test method → Added explanatory comment
8. ✅ Duplicate string literal "Photo not found" → Created constant in PhotoService

**Verification:**
- ✅ All backend tests passing (74/74)
- ✅ Backend starts without errors
- ✅ No runtime regressions

## Next Steps

1. ✅ All CRITICAL issues resolved
2. Wait for next SonarCloud scan to confirm fixes (2-5 minutes after push)
3. Optional: Address MAJOR issues (9 remaining, non-blocking)

---

**Note:** For complete issue list, visit:  
https://sonarcloud.io/project/issues?resolved=false&id=kojder_photo-map-app-backend

