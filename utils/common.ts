export function formatDate(isoString:any) {
    const date = new Date(isoString);
  
    const options:any = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }