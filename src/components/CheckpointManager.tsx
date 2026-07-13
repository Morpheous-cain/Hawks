import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, QrCode, MapPin, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Checkpoint {
  id: string;
  site_id: string;
  checkpoint_name: string;
  location_description: string;
  qr_code: string;
  gps_coordinates: string | null;
  expected_scan_order: number | null;
  is_active: boolean;
  created_at: string;
}

const CheckpointManager = () => {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    site_id: '',
    checkpoint_name: '',
    location_description: '',
    gps_coordinates: '',
    expected_scan_order: ''
  });

  useEffect(() => {
    fetchCheckpoints();
    fetchSites();
  }, []);

  const fetchSites = async () => {
    const { data, error } = await supabase
      .from('sites')
      .select('id, site_name')
      .order('site_name');

    if (!error && data) {
      setSites(data);
    }
  };

  const fetchCheckpoints = async () => {
    setLoading(true);
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('User not authenticated');
      toast.error('Please log in to view checkpoints');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('checkpoints')
      .select(`
        *,
        sites(site_name)
      `)
      .order('expected_scan_order', { ascending: true });

    if (error) {
      console.error('Error fetching checkpoints:', error);
      toast.error('Failed to load checkpoints');
    } else {
      console.log('Checkpoints loaded:', data?.length);
      setCheckpoints(data || []);
    }
    setLoading(false);
  };

  const generateQRCode = () => {
    return `CKP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.site_id || !formData.checkpoint_name) {
      toast.error('Please fill in required fields');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Not authenticated');
      return;
    }

    const { error } = await supabase
      .from('checkpoints')
      .insert({
        site_id: formData.site_id,
        checkpoint_name: formData.checkpoint_name,
        location_description: formData.location_description,
        gps_coordinates: formData.gps_coordinates || null,
        expected_scan_order: formData.expected_scan_order ? parseInt(formData.expected_scan_order) : null,
        qr_code: generateQRCode(),
        created_by: user.id
      });

    if (error) {
      console.error('Error creating checkpoint:', error);
      toast.error('Failed to create checkpoint');
    } else {
      toast.success('Checkpoint created successfully');
      setDialogOpen(false);
      setFormData({
        site_id: '',
        checkpoint_name: '',
        location_description: '',
        gps_coordinates: '',
        expected_scan_order: ''
      });
      fetchCheckpoints();
    }
  };

  const toggleCheckpointStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('checkpoints')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update checkpoint status');
    } else {
      toast.success(`Checkpoint ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchCheckpoints();
    }
  };

  const printQRCode = (checkpoint: Checkpoint) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print QR codes');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Checkpoint QR Code - ${checkpoint.checkpoint_name}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
          }
          .qr-container {
            text-align: center;
            border: 2px solid #000;
            padding: 30px;
            max-width: 400px;
          }
          .qr-code {
            font-size: 24px;
            font-weight: bold;
            letter-spacing: 2px;
            margin: 20px 0;
            padding: 15px;
            border: 3px dashed #333;
            background: #f5f5f5;
          }
          h2 { margin: 10px 0; }
          p { margin: 5px 0; color: #666; }
        </style>
      </head>
      <body>
        <div class="qr-container">
          <h2>${checkpoint.checkpoint_name}</h2>
          <p>${checkpoint.location_description || ''}</p>
          <div class="qr-code">${checkpoint.qr_code}</div>
          <p><small>Scan this code during patrol</small></p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Checkpoint Management</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Checkpoint
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Checkpoint</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="site_id">Site *</Label>
                <Select
                  value={formData.site_id}
                  onValueChange={(value) => setFormData({ ...formData, site_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select site" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.site_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="checkpoint_name">Checkpoint Name *</Label>
                <Input
                  id="checkpoint_name"
                  value={formData.checkpoint_name}
                  onChange={(e) => setFormData({ ...formData, checkpoint_name: e.target.value })}
                  placeholder="e.g., Main Entrance, Parking Area"
                />
              </div>

              <div>
                <Label htmlFor="location_description">Location Description</Label>
                <Textarea
                  id="location_description"
                  value={formData.location_description}
                  onChange={(e) => setFormData({ ...formData, location_description: e.target.value })}
                  placeholder="Detailed location information"
                />
              </div>

              <div>
                <Label htmlFor="gps_coordinates">GPS Coordinates</Label>
                <Input
                  id="gps_coordinates"
                  value={formData.gps_coordinates}
                  onChange={(e) => setFormData({ ...formData, gps_coordinates: e.target.value })}
                  placeholder="-1.2921, 36.8219"
                />
              </div>

              <div>
                <Label htmlFor="expected_scan_order">Expected Scan Order</Label>
                <Input
                  id="expected_scan_order"
                  type="number"
                  value={formData.expected_scan_order}
                  onChange={(e) => setFormData({ ...formData, expected_scan_order: e.target.value })}
                  placeholder="1, 2, 3..."
                />
              </div>

              <Button type="submit" className="w-full">Create Checkpoint</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Checkpoint</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>QR Code</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : checkpoints.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-foreground/80 font-medium">
                  No checkpoints found. Create your first checkpoint.
                </TableCell>
              </TableRow>
            ) : (
              checkpoints.map((checkpoint: any) => (
                <TableRow key={checkpoint.id}>
                  <TableCell className="font-medium">{checkpoint.checkpoint_name}</TableCell>
                  <TableCell>{checkpoint.sites?.site_name || 'Not Assigned'}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {checkpoint.location_description || '-'}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {checkpoint.qr_code}
                    </code>
                  </TableCell>
                  <TableCell>{checkpoint.expected_scan_order || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={checkpoint.is_active ? 'default' : 'secondary'}>
                      {checkpoint.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => printQRCode(checkpoint)}
                      >
                        <QrCode className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleCheckpointStatus(checkpoint.id, checkpoint.is_active)}
                      >
                        {checkpoint.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default CheckpointManager;