# ✅ Deployment Checklist - BatchHitlReviewModal v2

## Pre-Deployment (Dev Environment)

### Code Review
- [ ] Component file exists: `BatchHitlReviewModal_v2.tsx` (29KB)
- [ ] All TypeScript types correct
- [ ] No `any` types without reason
- [ ] Imports all valid
- [ ] No unused variables

### Build Verification
```bash
cd frontend
npm run build
```
- [ ] Build passes without errors
- [ ] No TypeScript warnings
- [ ] No unused imports warnings
- [ ] Output shows "✓ Generating static pages"

### Code Quality
```bash
npm run lint  # if available
```
- [ ] No linting errors
- [ ] Code formatted consistently
- [ ] Comments clear and helpful
- [ ] No console.log statements (except important ones)

---

## Local Testing

### Component Functionality
- [ ] Modal opens without error
- [ ] Document tabs visible
- [ ] Can switch between tabs
- [ ] PDF loads in left panel (40% width)
- [ ] Fields visible in right panel (60% width)

### PDF Panel (Left)
- [ ] PDF iframe renders
- [ ] PDF scrolls vertically
- [ ] PDF displays correctly (not blank)
- [ ] No iframe errors in console
- [ ] Responsive: scales on window resize

### Field Cards (Right)
- [ ] All fields displayed
- [ ] Confidence scores shown (e.g., 85%)
- [ ] Status badges visible (Approved/Pending)
- [ ] Cards are collapsed initially
- [ ] Cards have border/background (visual distinct)

### Card Expansion
- [ ] Click header to expand
- [ ] Chevron icon rotates
- [ ] Details slide down smoothly
- [ ] Source snippet shows if available
- [ ] Action buttons appear (Terima/Koreksi)
- [ ] Click again to collapse

### Approval Workflow
- [ ] Click "Terima" button
- [ ] Card status changes to "APPROVED"
- [ ] Badge color changes (emerald)
- [ ] No console errors
- [ ] State persists on scroll

### Correction Workflow
- [ ] Click "Koreksi" button
- [ ] Input field appears
- [ ] Type text in input
- [ ] Click "Koreksi" button again
- [ ] Value saves
- [ ] Status changes
- [ ] No validation errors

### Table Fields (if any)
- [ ] Table displays in card
- [ ] Can expand to see full table
- [ ] Source snippet shows table rows
- [ ] Correction format is JSON array

### Tab Switching
- [ ] Click different document tab
- [ ] PDF changes to new document
- [ ] Fields update to new document
- [ ] Approved state preserved
- [ ] Expansion state resets
- [ ] No visual artifacts

### Batch Finalization
- [ ] All fields approvable (no blockers)
- [ ] "Finalisasi" button enabled
- [ ] Click finalize
- [ ] Validation passes
- [ ] Returns to dashboard
- [ ] Shows success message

---

## Mobile Testing

### Responsive Layout
- [ ] Desktop (1280px): 40/60 split
- [ ] Tablet (768px): Adjusted split
- [ ] Mobile (<768px): Stacked layout
- [ ] No horizontal scroll needed
- [ ] Touch targets adequate size

### Mobile Interaction
- [ ] Tap to expand field (works on touch)
- [ ] Approve button touchable
- [ ] Input keyboard appears
- [ ] Submit works
- [ ] No layout shift

### Performance
- [ ] No lag when scrolling
- [ ] No jank when expanding
- [ ] Smooth transitions
- [ ] Memory reasonable

---

## Accessibility

### Keyboard Navigation
- [ ] Tab through fields
- [ ] Enter to expand/collapse
- [ ] Button labels read clearly
- [ ] Color not only indicator (badge has text)

### Screen Reader
- [ ] Headers announced
- [ ] Field names clear
- [ ] Button purposes clear
- [ ] Status updates announced

### Visual
- [ ] Sufficient contrast
- [ ] Focus indicators visible
- [ ] No flashing elements

---

## Browser Compatibility

Test on:
- [ ] Chrome latest
- [ ] Firefox latest
- [ ] Safari latest
- [ ] Edge latest
- [ ] Mobile Chrome
- [ ] Mobile Safari

Check for:
- [ ] Layout correct
- [ ] PDF loads
- [ ] Scrolling smooth
- [ ] No console errors
- [ ] Buttons functional

---

## Performance Testing

### Load Time
```
Baseline (v1): ~2000ms for modal open
Target (v2): ~1500ms or less
Measurement: DevTools Performance tab
```
- [ ] First paint: < 1.5s
- [ ] Largest contentful paint: < 2s
- [ ] Cumulative layout shift: < 0.1

### Memory
```
Baseline (v1): ~15MB for modal + iframe
Target (v2): ~12MB or less
Measurement: DevTools Memory tab
```
- [ ] Initial: < 15MB
- [ ] After interactions: < 20MB
- [ ] No memory leaks on tab switch

### Interaction
```
Field expand: < 100ms
Approval save: < 500ms
Tab switch: < 1000ms
```

---

## Integration Testing

### With Dashboard
- [ ] Import resolves correctly
- [ ] Props pass through
- [ ] Modal opens from dashboard button
- [ ] onClose callback works
- [ ] onFinalized callback works
- [ ] Selected documents appear

### With API
- [ ] PDF endpoint returns correct data
- [ ] `/documents/{id}/download` works
- [ ] `/documents/{id}/segments` works
- [ ] Document profile loads
- [ ] Approval saves to backend
- [ ] Finalization calls backend
- [ ] Validation returns correctly

### Error Handling
- [ ] PDF fails to load: shows message
- [ ] API fails: shows error
- [ ] Validation fails: shows inline error
- [ ] Network error: recovers gracefully
- [ ] Missing data: handles null/undefined

---

## Staging Environment

### Deployment
```bash
git add frontend/src/app/dashboard/components/BatchHitlReviewModal_v2.tsx
git add frontend/README_BATCHHITL_V2.md
git commit -m "feat: BatchHitlReviewModal v2 with side-by-side layout"
git push origin staging
```

- [ ] Build succeeds
- [ ] Deploy succeeds
- [ ] No errors in logs
- [ ] App loads correctly
- [ ] Feature accessible

### Staging Testing
- [ ] Full QA testing
- [ ] User acceptance testing (if applicable)
- [ ] Performance validation
- [ ] Security review
- [ ] Smoke tests

---

## Production Deployment

### Pre-Deployment
- [ ] Code approved by team
- [ ] All tests passing
- [ ] Staging validation complete
- [ ] Release notes prepared
- [ ] Rollback plan documented

### Deployment
```bash
git merge staging --ff-only
git tag v2.0-batchhitlreviewmodal
git push origin main --tags
```

- [ ] Tag created
- [ ] Pipeline triggered
- [ ] Build succeeds
- [ ] Deploy succeeds
- [ ] Health checks pass

### Post-Deployment
- [ ] Monitor error logs
- [ ] Monitor performance metrics
- [ ] Gather user feedback
- [ ] Document issues
- [ ] Plan fixes/improvements

---

## Rollback Plan

If issues occur:

### Quick Rollback
```bash
# Revert component usage
git revert <commit-hash>
git push origin main
```

- [ ] Revert commit created
- [ ] Deploy triggered
- [ ] All working again
- [ ] Users notified

### Full Rollback
```bash
git checkout main~1
git push origin main --force-with-lease
```

- [ ] Code reverted
- [ ] Deploy triggered
- [ ] Verify working
- [ ] Incident report

---

## Monitoring (Post-Deploy)

### Metrics to Track

**Performance**
- [ ] API response time
- [ ] Page load time
- [ ] Error rate
- [ ] PDF load time

**Usage**
- [ ] Feature adoption
- [ ] Approval rate
- [ ] Average time per field
- [ ] User feedback

**Quality**
- [ ] Bug reports
- [ ] Console errors
- [ ] Validation failures
- [ ] Finalization failures

### Alert Thresholds
- [ ] Error rate > 1%: Alert
- [ ] PDF load > 5s: Alert
- [ ] API response > 2s: Alert
- [ ] Memory leak detected: Alert

---

## Documentation

- [ ] README_BATCHHITL_V2.md created
- [ ] INTEGRATION_GUIDE_V2.md created
- [ ] Component code commented
- [ ] API changes documented (none)
- [ ] Release notes prepared
- [ ] User guide updated (if needed)

---

## Sign-Off

### Development
- [ ] Developer: _______________ Date: ___
- [ ] Code Review: ______________ Date: ___

### QA
- [ ] QA Lead: _________________ Date: ___
- [ ] Staging Approval: _________ Date: ___

### Product/PM
- [ ] Product Owner: ___________ Date: ___

### DevOps/Deployment
- [ ] DevOps: __________________ Date: ___
- [ ] Production Deployment: ____ Date: ___

---

## Timeline

```
Phase 1 - Dev & Testing: 1-2 days
Phase 2 - Staging: 1 day
Phase 3 - Production: 1 day (during business hours)
Phase 4 - Monitoring: ongoing

Total: 3-4 days
```

---

## Contact & Escalation

**Issues?**
- [ ] Check logs
- [ ] Check documentation
- [ ] Reach out to dev team
- [ ] Escalate if blocking

**Emergency Rollback?**
- [ ] Contact DevOps
- [ ] Request immediate rollback
- [ ] Incident report
- [ ] Root cause analysis

---

## Notes

```
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________
```

---

**Status**: ⏳ Ready for Implementation

Last Updated: Oct 26, 2024
Version: v2.0
Component: BatchHitlReviewModal

