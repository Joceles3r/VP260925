@@ .. @@
             {/* Sort Order */}
-            <Select value={filters.sortOrder} onValueChange={(value) => updateFilter('sortOrder', value as 'asc' | 'desc')}>
+            <Select value={filters.sortOrder || 'desc'} onValueChange={(value) => updateFilter('sortOrder', value as 'asc' | 'desc')}>
               <SelectTrigger>
                 <SelectValue />
               </SelectTrigger>
@@ .. @@