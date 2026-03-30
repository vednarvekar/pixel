#include <iostream>
using namespace std;

int function(timeStamps: string){
    const longestGap = 0;

    for(int i=0; i<n; i++){
        const current = timeStamps[i];
        const next = timeStamps[i+1];

        const gap = next - current;

        if(gap > longestGap){
            longestGap  = gap;
        }

    }
}

function getLongestGap(timestamps) {
    if (timestamps.length < 2) return 0;

    // 1. Sort them so "consecutive" actually means next in time
    const sorted = timestamps.sort();
    
    let maxGap = 0;

    for (let i = 1; i < sorted.length; i++) {
        // 2. Convert ISO strings to Date objects/milliseconds
        const current = new Date(sorted[i]);
        const previous = new Date(sorted[i - 1]);
        
        // 3. Calculate the difference
        const diff = current - previous; 

        // 4. Update the record holder
        if (diff > maxGap) {
            maxGap = diff;
        }
    }

    return maxGap; // Returns gap in milliseconds
}