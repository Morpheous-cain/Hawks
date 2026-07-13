export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      advisory_history: {
        Row: {
          category: string
          created_at: string | null
          id: string
          level: string
          message: string
          received_at: string
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          level: string
          message: string
          received_at?: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          level?: string
          message?: string
          received_at?: string
        }
        Relationships: []
      }
      alarm_activations: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alarm_number: string
          alarm_source: string | null
          alarm_type: string
          arrived_at: string | null
          assigned_to: string | null
          assigned_vehicle_id: string | null
          client_id: string | null
          created_at: string | null
          dispatched_at: string | null
          false_alarm: boolean | null
          gps_lat: number | null
          gps_lng: number | null
          id: string
          location: string
          outcome: string | null
          outcome_notes: string | null
          photos: Json | null
          priority: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          response_time_minutes: number | null
          sensor_id: string | null
          site_id: string | null
          sla_deadline: string | null
          sla_target_minutes: number | null
          status: string
          triggered_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alarm_number: string
          alarm_source?: string | null
          alarm_type: string
          arrived_at?: string | null
          assigned_to?: string | null
          assigned_vehicle_id?: string | null
          client_id?: string | null
          created_at?: string | null
          dispatched_at?: string | null
          false_alarm?: boolean | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          location: string
          outcome?: string | null
          outcome_notes?: string | null
          photos?: Json | null
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          response_time_minutes?: number | null
          sensor_id?: string | null
          site_id?: string | null
          sla_deadline?: string | null
          sla_target_minutes?: number | null
          status?: string
          triggered_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alarm_number?: string
          alarm_source?: string | null
          alarm_type?: string
          arrived_at?: string | null
          assigned_to?: string | null
          assigned_vehicle_id?: string | null
          client_id?: string | null
          created_at?: string | null
          dispatched_at?: string | null
          false_alarm?: boolean | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          location?: string
          outcome?: string | null
          outcome_notes?: string | null
          photos?: Json | null
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          response_time_minutes?: number | null
          sensor_id?: string | null
          site_id?: string | null
          sla_deadline?: string | null
          sla_target_minutes?: number | null
          status?: string
          triggered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alarm_activations_assigned_vehicle_id_fkey"
            columns: ["assigned_vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alarm_activations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alarm_activations_sensor_id_fkey"
            columns: ["sensor_id"]
            isOneToOne: false
            referencedRelation: "alarm_sensors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alarm_activations_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      alarm_sensors: {
        Row: {
          client_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          installation_date: string | null
          is_active: boolean | null
          last_test_date: string | null
          location_description: string
          next_maintenance_date: string | null
          sensor_id: string
          sensor_type: string
          site_id: string | null
          status: string | null
          zone_number: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          installation_date?: string | null
          is_active?: boolean | null
          last_test_date?: string | null
          location_description: string
          next_maintenance_date?: string | null
          sensor_id: string
          sensor_type: string
          site_id?: string | null
          status?: string | null
          zone_number?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          installation_date?: string | null
          is_active?: boolean | null
          last_test_date?: string | null
          location_description?: string
          next_maintenance_date?: string | null
          sensor_id?: string
          sensor_type?: string
          site_id?: string | null
          status?: string | null
          zone_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alarm_sensors_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alarm_sensors_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          check_in: string
          check_out: string | null
          created_at: string | null
          id: string
          notes: string | null
          shift_type: string | null
          site: string
          staff_id: string
          status: string | null
        }
        Insert: {
          check_in: string
          check_out?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          shift_type?: string | null
          site: string
          staff_id: string
          status?: string | null
        }
        Update: {
          check_in?: string
          check_out?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          shift_type?: string | null
          site?: string
          staff_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_trail: {
        Row: {
          action: string
          changes: Json | null
          id: string
          ip_address: string | null
          module: string
          record_id: string | null
          timestamp: string | null
          user_id: string | null
          user_role: string | null
          workstation: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          id?: string
          ip_address?: string | null
          module: string
          record_id?: string | null
          timestamp?: string | null
          user_id?: string | null
          user_role?: string | null
          workstation?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          id?: string
          ip_address?: string | null
          module?: string
          record_id?: string | null
          timestamp?: string | null
          user_id?: string | null
          user_role?: string | null
          workstation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_trail_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      body_cam_clips: {
        Row: {
          alarm_id: string | null
          category: string | null
          client_id: string | null
          clip_description: string | null
          clip_end: string
          clip_name: string
          clip_start: string
          clip_url: string
          created_at: string | null
          created_by: string | null
          dob_entry_id: string | null
          duration_seconds: number
          evidence_id: string
          expiry_date: string | null
          export_count: number | null
          exported: boolean | null
          footage_id: string
          gps_lat: number | null
          gps_lng: number | null
          id: string
          incident_id: string | null
          locked_as_evidence: boolean | null
          locked_at: string | null
          locked_by: string | null
          officer_id: string
          retention_years: number | null
          shared_with_client: boolean | null
          site_id: string | null
          status: string | null
          tags: string[] | null
          thumbnail_url: string | null
          trigger_source: string | null
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          alarm_id?: string | null
          category?: string | null
          client_id?: string | null
          clip_description?: string | null
          clip_end: string
          clip_name: string
          clip_start: string
          clip_url: string
          created_at?: string | null
          created_by?: string | null
          dob_entry_id?: string | null
          duration_seconds: number
          evidence_id: string
          expiry_date?: string | null
          export_count?: number | null
          exported?: boolean | null
          footage_id: string
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          incident_id?: string | null
          locked_as_evidence?: boolean | null
          locked_at?: string | null
          locked_by?: string | null
          officer_id: string
          retention_years?: number | null
          shared_with_client?: boolean | null
          site_id?: string | null
          status?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          trigger_source?: string | null
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          alarm_id?: string | null
          category?: string | null
          client_id?: string | null
          clip_description?: string | null
          clip_end?: string
          clip_name?: string
          clip_start?: string
          clip_url?: string
          created_at?: string | null
          created_by?: string | null
          dob_entry_id?: string | null
          duration_seconds?: number
          evidence_id?: string
          expiry_date?: string | null
          export_count?: number | null
          exported?: boolean | null
          footage_id?: string
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          incident_id?: string | null
          locked_as_evidence?: boolean | null
          locked_at?: string | null
          locked_by?: string | null
          officer_id?: string
          retention_years?: number | null
          shared_with_client?: boolean | null
          site_id?: string | null
          status?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          trigger_source?: string | null
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "body_cam_clips_alarm_id_fkey"
            columns: ["alarm_id"]
            isOneToOne: false
            referencedRelation: "alarm_activations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "body_cam_clips_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "body_cam_clips_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "body_cam_clips_dob_entry_id_fkey"
            columns: ["dob_entry_id"]
            isOneToOne: false
            referencedRelation: "dob_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "body_cam_clips_footage_id_fkey"
            columns: ["footage_id"]
            isOneToOne: false
            referencedRelation: "body_cam_footage"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "body_cam_clips_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "body_cam_clips_locked_by_fkey"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "body_cam_clips_officer_id_fkey"
            columns: ["officer_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "body_cam_clips_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      body_cam_devices: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          battery_level: number | null
          created_at: string | null
          device_id: string
          device_status: string
          firmware_version: string | null
          gps_enabled: boolean | null
          id: string
          last_sync: string | null
          night_vision_capable: boolean | null
          notes: string | null
          recording_quality: string | null
          serial_number: string
          storage_capacity_gb: number | null
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          battery_level?: number | null
          created_at?: string | null
          device_id: string
          device_status?: string
          firmware_version?: string | null
          gps_enabled?: boolean | null
          id?: string
          last_sync?: string | null
          night_vision_capable?: boolean | null
          notes?: string | null
          recording_quality?: string | null
          serial_number: string
          storage_capacity_gb?: number | null
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          battery_level?: number | null
          created_at?: string | null
          device_id?: string
          device_status?: string
          firmware_version?: string | null
          gps_enabled?: boolean | null
          id?: string
          last_sync?: string | null
          night_vision_capable?: boolean | null
          notes?: string | null
          recording_quality?: string | null
          serial_number?: string
          storage_capacity_gb?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "body_cam_devices_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      body_cam_footage: {
        Row: {
          client_id: string | null
          created_at: string | null
          device_id: string
          duration_seconds: number | null
          file_hash: string
          file_size_mb: number | null
          file_url: string
          footage_id: string
          gps_lat: number | null
          gps_lng: number | null
          has_audio: boolean | null
          id: string
          is_live: boolean | null
          officer_id: string
          quality: string | null
          recording_end: string | null
          recording_start: string
          recording_type: string | null
          site_id: string | null
          stream_url: string | null
          upload_status: string | null
          uploaded_at: string | null
          watermark_applied: boolean | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          device_id: string
          duration_seconds?: number | null
          file_hash: string
          file_size_mb?: number | null
          file_url: string
          footage_id: string
          gps_lat?: number | null
          gps_lng?: number | null
          has_audio?: boolean | null
          id?: string
          is_live?: boolean | null
          officer_id: string
          quality?: string | null
          recording_end?: string | null
          recording_start: string
          recording_type?: string | null
          site_id?: string | null
          stream_url?: string | null
          upload_status?: string | null
          uploaded_at?: string | null
          watermark_applied?: boolean | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          device_id?: string
          duration_seconds?: number | null
          file_hash?: string
          file_size_mb?: number | null
          file_url?: string
          footage_id?: string
          gps_lat?: number | null
          gps_lng?: number | null
          has_audio?: boolean | null
          id?: string
          is_live?: boolean | null
          officer_id?: string
          quality?: string | null
          recording_end?: string | null
          recording_start?: string
          recording_type?: string | null
          site_id?: string | null
          stream_url?: string | null
          upload_status?: string | null
          uploaded_at?: string | null
          watermark_applied?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "body_cam_footage_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "body_cam_footage_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "body_cam_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "body_cam_footage_officer_id_fkey"
            columns: ["officer_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "body_cam_footage_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      calls: {
        Row: {
          answered_at: string | null
          assigned_operator: string | null
          call_number: string
          caller_name: string | null
          caller_number: string
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          linked_ticket_id: string | null
          notes: string | null
          priority: Database["public"]["Enums"]["call_priority_type"]
          purpose: string | null
          recording_url: string | null
          source_line: string
          started_at: string
          status: Database["public"]["Enums"]["call_status_type"]
        }
        Insert: {
          answered_at?: string | null
          assigned_operator?: string | null
          call_number: string
          caller_name?: string | null
          caller_number: string
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          linked_ticket_id?: string | null
          notes?: string | null
          priority?: Database["public"]["Enums"]["call_priority_type"]
          purpose?: string | null
          recording_url?: string | null
          source_line: string
          started_at?: string
          status?: Database["public"]["Enums"]["call_status_type"]
        }
        Update: {
          answered_at?: string | null
          assigned_operator?: string | null
          call_number?: string
          caller_name?: string | null
          caller_number?: string
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          linked_ticket_id?: string | null
          notes?: string | null
          priority?: Database["public"]["Enums"]["call_priority_type"]
          purpose?: string | null
          recording_url?: string | null
          source_line?: string
          started_at?: string
          status?: Database["public"]["Enums"]["call_status_type"]
        }
        Relationships: [
          {
            foreignKeyName: "calls_assigned_operator_fkey"
            columns: ["assigned_operator"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      checkpoints: {
        Row: {
          checkpoint_name: string
          created_at: string | null
          created_by: string | null
          expected_scan_order: number | null
          gps_coordinates: string | null
          id: string
          is_active: boolean | null
          location_description: string | null
          qr_code: string
          site_id: string | null
        }
        Insert: {
          checkpoint_name: string
          created_at?: string | null
          created_by?: string | null
          expected_scan_order?: number | null
          gps_coordinates?: string | null
          id?: string
          is_active?: boolean | null
          location_description?: string | null
          qr_code: string
          site_id?: string | null
        }
        Update: {
          checkpoint_name?: string
          created_at?: string | null
          created_by?: string | null
          expected_scan_order?: number | null
          gps_coordinates?: string | null
          id?: string
          is_active?: boolean | null
          location_description?: string | null
          qr_code?: string
          site_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkpoints_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      client_complaints: {
        Row: {
          client_id: string | null
          complaint_number: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string
          escalated: boolean
          escalated_at: string | null
          escalated_by: string | null
          escalation_notes: string | null
          id: string
          severity: string
          status: string
          subject: string
          ticket_id: string | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          complaint_number?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description: string
          escalated?: boolean
          escalated_at?: string | null
          escalated_by?: string | null
          escalation_notes?: string | null
          id?: string
          severity?: string
          status?: string
          subject: string
          ticket_id?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          complaint_number?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string
          escalated?: boolean
          escalated_at?: string | null
          escalated_by?: string | null
          escalation_notes?: string | null
          id?: string
          severity?: string
          status?: string
          subject?: string
          ticket_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_complaints_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_complaints_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      client_contacts: {
        Row: {
          client_id: string
          contact_type: string
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string
          position: string | null
        }
        Insert: {
          client_id: string
          contact_type: string
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone: string
          position?: string | null
        }
        Update: {
          client_id?: string
          contact_type?: string
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          position?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_finances: {
        Row: {
          ageing_days: number | null
          amount: number
          client_id: string
          created_at: string | null
          created_by: string | null
          id: string
          invoice_date: string
          invoice_number: string
          payment_date: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
        }
        Insert: {
          ageing_days?: number | null
          amount: number
          client_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          invoice_date: string
          invoice_number: string
          payment_date?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
        }
        Update: {
          ageing_days?: number | null
          amount?: number
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          payment_date?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "client_finances_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_finances_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          active_sites_count: number | null
          annual_value: number | null
          background: string | null
          client_id: string
          contract_ref: string | null
          created_at: string | null
          created_by: string | null
          id: string
          legal_name: string
          next_action: string | null
          pin: string | null
          primary_contact_name: string | null
          primary_contact_role: string | null
          registration_number: string | null
          secondary_contact_name: string | null
          secondary_contact_role: string | null
          sector: string | null
          status: string | null
          trading_name: string | null
          updated_at: string | null
          verified_by: string | null
        }
        Insert: {
          active_sites_count?: number | null
          annual_value?: number | null
          background?: string | null
          client_id: string
          contract_ref?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          legal_name: string
          next_action?: string | null
          pin?: string | null
          primary_contact_name?: string | null
          primary_contact_role?: string | null
          registration_number?: string | null
          secondary_contact_name?: string | null
          secondary_contact_role?: string | null
          sector?: string | null
          status?: string | null
          trading_name?: string | null
          updated_at?: string | null
          verified_by?: string | null
        }
        Update: {
          active_sites_count?: number | null
          annual_value?: number | null
          background?: string | null
          client_id?: string
          contract_ref?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          legal_name?: string
          next_action?: string | null
          pin?: string | null
          primary_contact_name?: string | null
          primary_contact_role?: string | null
          registration_number?: string | null
          secondary_contact_name?: string | null
          secondary_contact_role?: string | null
          sector?: string | null
          status?: string | null
          trading_name?: string | null
          updated_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clip_chain_of_custody: {
        Row: {
          access_expiry: string | null
          action: string
          action_details: string | null
          clip_id: string
          export_format: string | null
          export_reason: string | null
          id: string
          ip_address: string | null
          performed_at: string | null
          performed_by: string
          recipient: string | null
          user_agent: string | null
        }
        Insert: {
          access_expiry?: string | null
          action: string
          action_details?: string | null
          clip_id: string
          export_format?: string | null
          export_reason?: string | null
          id?: string
          ip_address?: string | null
          performed_at?: string | null
          performed_by: string
          recipient?: string | null
          user_agent?: string | null
        }
        Update: {
          access_expiry?: string | null
          action?: string
          action_details?: string | null
          clip_id?: string
          export_format?: string | null
          export_reason?: string | null
          id?: string
          ip_address?: string | null
          performed_at?: string | null
          performed_by?: string
          recipient?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clip_chain_of_custody_clip_id_fkey"
            columns: ["clip_id"]
            isOneToOne: false
            referencedRelation: "body_cam_clips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clip_chain_of_custody_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comms_records: {
        Row: {
          alarm_id: string | null
          created_at: string | null
          from_user: string | null
          full_transcript: string | null
          id: string
          incident_id: string | null
          message_summary: string | null
          recording_url: string | null
          timestamp: string
          to_unit: string | null
          to_user: string | null
          type: string
        }
        Insert: {
          alarm_id?: string | null
          created_at?: string | null
          from_user?: string | null
          full_transcript?: string | null
          id?: string
          incident_id?: string | null
          message_summary?: string | null
          recording_url?: string | null
          timestamp?: string
          to_unit?: string | null
          to_user?: string | null
          type: string
        }
        Update: {
          alarm_id?: string | null
          created_at?: string | null
          from_user?: string | null
          full_transcript?: string | null
          id?: string
          incident_id?: string | null
          message_summary?: string | null
          recording_url?: string | null
          timestamp?: string
          to_unit?: string | null
          to_user?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "comms_records_alarm_id_fkey"
            columns: ["alarm_id"]
            isOneToOne: false
            referencedRelation: "alarm_activations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comms_records_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comms_records_to_unit_fkey"
            columns: ["to_unit"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_tickets: {
        Row: {
          assigned_to: string | null
          channel: Database["public"]["Enums"]["communication_channel_type"]
          client_id: string | null
          created_at: string
          dispatch_created: boolean | null
          escalated_to: string | null
          escalation_reason: string | null
          id: string
          linked_call_id: string | null
          message: string
          priority: Database["public"]["Enums"]["call_priority_type"]
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          sender_contact: string
          sender_name: string | null
          site_id: string | null
          status: Database["public"]["Enums"]["ticket_status_type"]
          subject: string
          ticket_number: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          channel: Database["public"]["Enums"]["communication_channel_type"]
          client_id?: string | null
          created_at?: string
          dispatch_created?: boolean | null
          escalated_to?: string | null
          escalation_reason?: string | null
          id?: string
          linked_call_id?: string | null
          message: string
          priority?: Database["public"]["Enums"]["call_priority_type"]
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          sender_contact: string
          sender_name?: string | null
          site_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status_type"]
          subject: string
          ticket_number: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          channel?: Database["public"]["Enums"]["communication_channel_type"]
          client_id?: string | null
          created_at?: string
          dispatch_created?: boolean | null
          escalated_to?: string | null
          escalation_reason?: string | null
          id?: string
          linked_call_id?: string | null
          message?: string
          priority?: Database["public"]["Enums"]["call_priority_type"]
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          sender_contact?: string
          sender_name?: string | null
          site_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status_type"]
          subject?: string
          ticket_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_tickets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_tickets_escalated_to_fkey"
            columns: ["escalated_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_tickets_linked_call_id_fkey"
            columns: ["linked_call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_tickets_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_tickets_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          billing_frequency: string | null
          client_id: string
          contract_number: string
          created_at: string | null
          created_by: string | null
          document_url: string | null
          end_date: string
          id: string
          service_scope: string[] | null
          start_date: string
          status: Database["public"]["Enums"]["contract_status"] | null
          updated_at: string | null
          value: number | null
          verified_by: string | null
        }
        Insert: {
          billing_frequency?: string | null
          client_id: string
          contract_number: string
          created_at?: string | null
          created_by?: string | null
          document_url?: string | null
          end_date: string
          id?: string
          service_scope?: string[] | null
          start_date: string
          status?: Database["public"]["Enums"]["contract_status"] | null
          updated_at?: string | null
          value?: number | null
          verified_by?: string | null
        }
        Update: {
          billing_frequency?: string | null
          client_id?: string
          contract_number?: string
          created_at?: string | null
          created_by?: string | null
          document_url?: string | null
          end_date?: string
          id?: string
          service_scope?: string[] | null
          start_date?: string
          status?: Database["public"]["Enums"]["contract_status"] | null
          updated_at?: string | null
          value?: number | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_members: {
        Row: {
          created_at: string | null
          crew_id: string
          id: string
          mobile_number: string | null
          name: string
          role: string
          staff_id: string | null
          unit_id: string | null
        }
        Insert: {
          created_at?: string | null
          crew_id: string
          id?: string
          mobile_number?: string | null
          name: string
          role: string
          staff_id?: string | null
          unit_id?: string | null
        }
        Update: {
          created_at?: string | null
          crew_id?: string
          id?: string
          mobile_number?: string | null
          name?: string
          role?: string
          staff_id?: string | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crew_members_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_members_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      cs_categories: {
        Row: {
          created_at: string
          description: string | null
          escalation_sla_hours: number
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          escalation_sla_hours?: number
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          escalation_sla_hours?: number
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      cs_notes: {
        Row: {
          complaint_id: string | null
          created_at: string
          created_by: string | null
          id: string
          note_text: string
          ticket_id: string | null
        }
        Insert: {
          complaint_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          note_text: string
          ticket_id?: string | null
        }
        Update: {
          complaint_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          note_text?: string
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cs_notes_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "client_complaints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cs_notes_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      device_assignment_log: {
        Row: {
          assigned_at: string | null
          assigned_by: string
          battery_at_issue: number | null
          battery_at_return: number | null
          condition_at_issue: string | null
          condition_at_return: string | null
          device_id: string
          id: string
          notes: string | null
          officer_id: string
          returned_at: string | null
          shift_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by: string
          battery_at_issue?: number | null
          battery_at_return?: number | null
          condition_at_issue?: string | null
          condition_at_return?: string | null
          device_id: string
          id?: string
          notes?: string | null
          officer_id: string
          returned_at?: string | null
          shift_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string
          battery_at_issue?: number | null
          battery_at_return?: number | null
          condition_at_issue?: string | null
          condition_at_return?: string | null
          device_id?: string
          id?: string
          notes?: string | null
          officer_id?: string
          returned_at?: string | null
          shift_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "device_assignment_log_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_assignment_log_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "body_cam_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_assignment_log_officer_id_fkey"
            columns: ["officer_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatch_logs: {
        Row: {
          accepted_at: string | null
          alarm_event_id: string | null
          closed_at: string | null
          closure_code: string | null
          closure_notes: string | null
          created_at: string | null
          dispatch_id: string
          dispatched_at: string | null
          dispatched_by: string | null
          en_route_at: string | null
          id: string
          on_scene_at: string | null
          unit_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          alarm_event_id?: string | null
          closed_at?: string | null
          closure_code?: string | null
          closure_notes?: string | null
          created_at?: string | null
          dispatch_id: string
          dispatched_at?: string | null
          dispatched_by?: string | null
          en_route_at?: string | null
          id?: string
          on_scene_at?: string | null
          unit_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          alarm_event_id?: string | null
          closed_at?: string | null
          closure_code?: string | null
          closure_notes?: string | null
          created_at?: string | null
          dispatch_id?: string
          dispatched_at?: string | null
          dispatched_by?: string | null
          en_route_at?: string | null
          id?: string
          on_scene_at?: string | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_logs_alarm_event_id_fkey"
            columns: ["alarm_event_id"]
            isOneToOne: false
            referencedRelation: "alarm_activations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_logs_dispatched_by_fkey"
            columns: ["dispatched_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_logs_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatch_requests: {
        Row: {
          approved_by: string | null
          assigned_unit: string | null
          call_id: string | null
          completed_at: string | null
          completion_notes: string | null
          created_at: string
          description: string
          dispatch_type: string
          dispatched_at: string | null
          gps_lat: number | null
          gps_lng: number | null
          id: string
          location: string
          priority: Database["public"]["Enums"]["call_priority_type"]
          request_number: string
          requested_by: string
          status: string
          ticket_id: string
        }
        Insert: {
          approved_by?: string | null
          assigned_unit?: string | null
          call_id?: string | null
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string
          description: string
          dispatch_type: string
          dispatched_at?: string | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          location: string
          priority?: Database["public"]["Enums"]["call_priority_type"]
          request_number: string
          requested_by: string
          status?: string
          ticket_id: string
        }
        Update: {
          approved_by?: string | null
          assigned_unit?: string | null
          call_id?: string | null
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string
          description?: string
          dispatch_type?: string
          dispatched_at?: string | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          location?: string
          priority?: Database["public"]["Enums"]["call_priority_type"]
          request_number?: string
          requested_by?: string
          status?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_requests_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_requests_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "communication_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      dob_entries: {
        Row: {
          created_at: string
          description: string
          entry_time: string
          entry_type: string
          id: string
          recorded_by: string
          site_name: string
        }
        Insert: {
          created_at?: string
          description: string
          entry_time?: string
          entry_type: string
          id?: string
          recorded_by: string
          site_name: string
        }
        Update: {
          created_at?: string
          description?: string
          entry_time?: string
          entry_type?: string
          id?: string
          recorded_by?: string
          site_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "dob_entries_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_access_logs: {
        Row: {
          access_type: string
          accessed_at: string
          accessed_by: string
          document_id: string
          id: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          access_type: string
          accessed_at?: string
          accessed_by: string
          document_id: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          access_type?: string
          accessed_at?: string
          accessed_by?: string
          document_id?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_access_logs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: Database["public"]["Enums"]["document_category"]
          client_id: string | null
          created_at: string
          description: string | null
          document_number: string
          expiry_date: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          metadata: Json | null
          parent_document_id: string | null
          requires_signature: boolean | null
          signature_data: string | null
          signed_at: string | null
          signed_by: string | null
          site_id: string | null
          staff_id: string | null
          status: Database["public"]["Enums"]["document_status"] | null
          tags: string[] | null
          title: string
          updated_at: string
          uploaded_at: string
          uploaded_by: string | null
          version_number: number | null
        }
        Insert: {
          category: Database["public"]["Enums"]["document_category"]
          client_id?: string | null
          created_at?: string
          description?: string | null
          document_number: string
          expiry_date?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          metadata?: Json | null
          parent_document_id?: string | null
          requires_signature?: boolean | null
          signature_data?: string | null
          signed_at?: string | null
          signed_by?: string | null
          site_id?: string | null
          staff_id?: string | null
          status?: Database["public"]["Enums"]["document_status"] | null
          tags?: string[] | null
          title: string
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
          version_number?: number | null
        }
        Update: {
          category?: Database["public"]["Enums"]["document_category"]
          client_id?: string | null
          created_at?: string
          description?: string | null
          document_number?: string
          expiry_date?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          metadata?: Json | null
          parent_document_id?: string | null
          requires_signature?: boolean | null
          signature_data?: string | null
          signed_at?: string | null
          signed_by?: string | null
          site_id?: string | null
          staff_id?: string | null
          status?: Database["public"]["Enums"]["document_status"] | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
          version_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_parent_document_id_fkey"
            columns: ["parent_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      event_staff_assignments: {
        Row: {
          check_in_time: string | null
          check_out_time: string | null
          created_at: string | null
          event_id: string | null
          id: string
          notes: string | null
          role: string
          shift_end: string | null
          shift_start: string | null
          staff_id: string | null
          status: string | null
        }
        Insert: {
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          role: string
          shift_end?: string | null
          shift_start?: string | null
          staff_id?: string | null
          status?: string | null
        }
        Update: {
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          role?: string
          shift_end?: string | null
          shift_start?: string | null
          staff_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_staff_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "security_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_staff_assignments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_evidence: {
        Row: {
          chain_of_custody: Json
          collected_at: string
          collected_by: string | null
          created_at: string
          description: string | null
          evidence_type: string
          external_url: string | null
          file_size: number | null
          id: string
          incident_id: string
          mime_type: string | null
          sha256: string | null
          storage_bucket: string | null
          storage_path: string | null
          title: string
        }
        Insert: {
          chain_of_custody?: Json
          collected_at?: string
          collected_by?: string | null
          created_at?: string
          description?: string | null
          evidence_type?: string
          external_url?: string | null
          file_size?: number | null
          id?: string
          incident_id: string
          mime_type?: string | null
          sha256?: string | null
          storage_bucket?: string | null
          storage_path?: string | null
          title: string
        }
        Update: {
          chain_of_custody?: Json
          collected_at?: string
          collected_by?: string | null
          created_at?: string
          description?: string | null
          evidence_type?: string
          external_url?: string | null
          file_size?: number | null
          id?: string
          incident_id?: string
          mime_type?: string | null
          sha256?: string | null
          storage_bucket?: string | null
          storage_path?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_evidence_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          ai_summary: string | null
          ai_summary_at: string | null
          assigned_to: string | null
          client_id: string | null
          created_at: string | null
          description: string | null
          id: string
          incident_number: string
          incident_type: string
          linked_alarm_id: string | null
          linked_patrol_id: string | null
          location: string
          mandatory_fields_data: Json | null
          occurred_at: string
          reported_by: string | null
          resolved_at: string | null
          severity: string
          site_id: string | null
          sla_breached: boolean | null
          sla_deadline: string | null
          sla_target_minutes: number | null
          sop_type: string | null
          status: string
          steps_completed: Json | null
          supervisor_approved_at: string | null
          supervisor_approved_by: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          ai_summary?: string | null
          ai_summary_at?: string | null
          assigned_to?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          incident_number: string
          incident_type: string
          linked_alarm_id?: string | null
          linked_patrol_id?: string | null
          location: string
          mandatory_fields_data?: Json | null
          occurred_at: string
          reported_by?: string | null
          resolved_at?: string | null
          severity?: string
          site_id?: string | null
          sla_breached?: boolean | null
          sla_deadline?: string | null
          sla_target_minutes?: number | null
          sop_type?: string | null
          status?: string
          steps_completed?: Json | null
          supervisor_approved_at?: string | null
          supervisor_approved_by?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          ai_summary?: string | null
          ai_summary_at?: string | null
          assigned_to?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          incident_number?: string
          incident_type?: string
          linked_alarm_id?: string | null
          linked_patrol_id?: string | null
          location?: string
          mandatory_fields_data?: Json | null
          occurred_at?: string
          reported_by?: string | null
          resolved_at?: string | null
          severity?: string
          site_id?: string | null
          sla_breached?: boolean | null
          sla_deadline?: string | null
          sla_target_minutes?: number | null
          sop_type?: string | null
          status?: string
          steps_completed?: Json | null
          supervisor_approved_at?: string | null
          supervisor_approved_by?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incidents_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_linked_alarm_id_fkey"
            columns: ["linked_alarm_id"]
            isOneToOne: false
            referencedRelation: "alarm_activations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_sop_type_fkey"
            columns: ["sop_type"]
            isOneToOne: false
            referencedRelation: "sop_configurations"
            referencedColumns: ["incident_type"]
          },
        ]
      }
      investigation_attachments: {
        Row: {
          attached_at: string
          attached_by: string | null
          attachment_type: string | null
          document_id: string
          id: string
          investigation_id: string
          notes: string | null
        }
        Insert: {
          attached_at?: string
          attached_by?: string | null
          attachment_type?: string | null
          document_id: string
          id?: string
          investigation_id: string
          notes?: string | null
        }
        Update: {
          attached_at?: string
          attached_by?: string | null
          attachment_type?: string | null
          document_id?: string
          id?: string
          investigation_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investigation_attachments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_records: {
        Row: {
          approved_by: string | null
          created_at: string | null
          created_by: string | null
          days_count: number
          end_date: string
          id: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          reason: string | null
          staff_id: string
          start_date: string
          status: string | null
        }
        Insert: {
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          days_count: number
          end_date: string
          id?: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          reason?: string | null
          staff_id: string
          start_date: string
          status?: string | null
        }
        Update: {
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          days_count?: number
          end_date?: string
          id?: string
          leave_type?: Database["public"]["Enums"]["leave_type"]
          reason?: string | null
          staff_id?: string
          start_date?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_records_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_records_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      loss_control_behavior_patterns: {
        Row: {
          confidence_score: number | null
          created_at: string
          detected_by: string | null
          detection_criteria: Json
          entity_ids: string[] | null
          entity_type: string | null
          id: string
          investigation_notes: string | null
          investigation_required: boolean | null
          pattern_end_date: string | null
          pattern_name: string
          pattern_start_date: string | null
          pattern_type: string
          related_record_ids: string[] | null
          site_ids: string[] | null
          status: string
          updated_at: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          detected_by?: string | null
          detection_criteria: Json
          entity_ids?: string[] | null
          entity_type?: string | null
          id?: string
          investigation_notes?: string | null
          investigation_required?: boolean | null
          pattern_end_date?: string | null
          pattern_name: string
          pattern_start_date?: string | null
          pattern_type: string
          related_record_ids?: string[] | null
          site_ids?: string[] | null
          status?: string
          updated_at?: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          detected_by?: string | null
          detection_criteria?: Json
          entity_ids?: string[] | null
          entity_type?: string | null
          id?: string
          investigation_notes?: string | null
          investigation_required?: boolean | null
          pattern_end_date?: string | null
          pattern_name?: string
          pattern_start_date?: string | null
          pattern_type?: string
          related_record_ids?: string[] | null
          site_ids?: string[] | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      loss_control_corrective_actions: {
        Row: {
          action_description: string
          action_title: string
          action_type: string
          assigned_at: string | null
          assigned_to: string | null
          completed_at: string | null
          completion_notes: string | null
          created_at: string
          created_by: string | null
          due_date: string | null
          id: string
          record_id: string
          status: string
          updated_at: string
          verification_notes: string | null
          verification_required: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          action_description: string
          action_title: string
          action_type: string
          assigned_at?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          record_id: string
          status?: string
          updated_at?: string
          verification_notes?: string | null
          verification_required?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          action_description?: string
          action_title?: string
          action_type?: string
          assigned_at?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          record_id?: string
          status?: string
          updated_at?: string
          verification_notes?: string | null
          verification_required?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loss_control_corrective_actions_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "loss_control_records"
            referencedColumns: ["id"]
          },
        ]
      }
      loss_control_escalations: {
        Row: {
          acknowledged_at: string | null
          created_at: string
          escalated_at: string
          escalated_to: string | null
          escalation_level: number
          escalation_reason: string
          id: string
          record_id: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          response_deadline: string | null
          sla_deadline: string
          status: string
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          created_at?: string
          escalated_at?: string
          escalated_to?: string | null
          escalation_level?: number
          escalation_reason: string
          id?: string
          record_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          response_deadline?: string | null
          sla_deadline: string
          status?: string
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          created_at?: string
          escalated_at?: string
          escalated_to?: string | null
          escalation_level?: number
          escalation_reason?: string
          id?: string
          record_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          response_deadline?: string | null
          sla_deadline?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loss_control_escalations_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "loss_control_records"
            referencedColumns: ["id"]
          },
        ]
      }
      loss_control_records: {
        Row: {
          assigned_to: string | null
          cashier_name: string | null
          category: string | null
          cctv_footage_refs: string[] | null
          cctv_required: boolean | null
          client_id: string | null
          corrective_actions_taken: string | null
          created_at: string
          created_by: string | null
          evidence_urls: Json | null
          financial_value: number | null
          id: string
          incident_date: string
          incident_description: string
          location: string | null
          notes: string | null
          officer_id: string | null
          pos_terminal_id: string | null
          priority: string
          record_number: string
          record_type: string
          resolved_at: string | null
          risk_score: number | null
          root_cause: string | null
          severity: string
          site_id: string | null
          status: string
          stock_affected: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          cashier_name?: string | null
          category?: string | null
          cctv_footage_refs?: string[] | null
          cctv_required?: boolean | null
          client_id?: string | null
          corrective_actions_taken?: string | null
          created_at?: string
          created_by?: string | null
          evidence_urls?: Json | null
          financial_value?: number | null
          id?: string
          incident_date: string
          incident_description: string
          location?: string | null
          notes?: string | null
          officer_id?: string | null
          pos_terminal_id?: string | null
          priority?: string
          record_number: string
          record_type: string
          resolved_at?: string | null
          risk_score?: number | null
          root_cause?: string | null
          severity: string
          site_id?: string | null
          status?: string
          stock_affected?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          cashier_name?: string | null
          category?: string | null
          cctv_footage_refs?: string[] | null
          cctv_required?: boolean | null
          client_id?: string | null
          corrective_actions_taken?: string | null
          created_at?: string
          created_by?: string | null
          evidence_urls?: Json | null
          financial_value?: number | null
          id?: string
          incident_date?: string
          incident_description?: string
          location?: string | null
          notes?: string | null
          officer_id?: string | null
          pos_terminal_id?: string | null
          priority?: string
          record_number?: string
          record_type?: string
          resolved_at?: string | null
          risk_score?: number | null
          root_cause?: string | null
          severity?: string
          site_id?: string | null
          status?: string
          stock_affected?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loss_control_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loss_control_records_officer_id_fkey"
            columns: ["officer_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loss_control_records_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      loss_control_risk_scores: {
        Row: {
          audit_recommended: boolean | null
          created_at: string
          entity_id: string
          entity_name: string | null
          entity_type: string
          financial_loss_total: number | null
          high_severity_count: number | null
          id: string
          incident_count: number | null
          last_incident_date: string | null
          pattern_description: string | null
          pattern_detected: boolean | null
          predictive_risk_level: string | null
          repeat_offender: boolean | null
          risk_period_end: string | null
          risk_period_start: string
          risk_score: number
          site_id: string | null
          updated_at: string
        }
        Insert: {
          audit_recommended?: boolean | null
          created_at?: string
          entity_id: string
          entity_name?: string | null
          entity_type: string
          financial_loss_total?: number | null
          high_severity_count?: number | null
          id?: string
          incident_count?: number | null
          last_incident_date?: string | null
          pattern_description?: string | null
          pattern_detected?: boolean | null
          predictive_risk_level?: string | null
          repeat_offender?: boolean | null
          risk_period_end?: string | null
          risk_period_start?: string
          risk_score?: number
          site_id?: string | null
          updated_at?: string
        }
        Update: {
          audit_recommended?: boolean | null
          created_at?: string
          entity_id?: string
          entity_name?: string | null
          entity_type?: string
          financial_loss_total?: number | null
          high_severity_count?: number | null
          id?: string
          incident_count?: number | null
          last_incident_date?: string | null
          pattern_description?: string | null
          pattern_detected?: boolean | null
          predictive_risk_level?: string | null
          repeat_offender?: boolean | null
          risk_period_end?: string | null
          risk_period_start?: string
          risk_score?: number
          site_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loss_control_risk_scores_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      mdt_messages: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          message_type: string
          priority: string | null
          read_at: string | null
          replied_at: string | null
          reply: string | null
          sent_by: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          message_type: string
          priority?: string | null
          read_at?: string | null
          replied_at?: string | null
          reply?: string | null
          sent_by: string
          vehicle_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          message_type?: string
          priority?: string | null
          read_at?: string | null
          replied_at?: string | null
          reply?: string | null
          sent_by?: string
          vehicle_id?: string
        }
        Relationships: []
      }
      mobile_incidents: {
        Row: {
          action_taken: string | null
          created_at: string | null
          description: string
          gps_lat: number | null
          gps_lng: number | null
          id: string
          incident_number: string
          incident_type: string
          location: string
          occurred_at: string
          officer_id: string
          patrol_id: string | null
          photo_urls: Json | null
          priority: string | null
          status: string
          vehicle_id: string
        }
        Insert: {
          action_taken?: string | null
          created_at?: string | null
          description: string
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          incident_number: string
          incident_type: string
          location: string
          occurred_at?: string
          officer_id: string
          patrol_id?: string | null
          photo_urls?: Json | null
          priority?: string | null
          status?: string
          vehicle_id: string
        }
        Update: {
          action_taken?: string | null
          created_at?: string | null
          description?: string
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          incident_number?: string
          incident_type?: string
          location?: string
          occurred_at?: string
          officer_id?: string
          patrol_id?: string | null
          photo_urls?: Json | null
          priority?: string | null
          status?: string
          vehicle_id?: string
        }
        Relationships: []
      }
      mobile_patrols: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          client_name: string | null
          created_at: string | null
          created_by: string | null
          end_time: string | null
          gps_trail: Json | null
          id: string
          notes: string | null
          officer_id: string
          patrol_id: string
          patrol_type: string
          priority: string
          route_name: string | null
          site_name: string
          start_time: string
          status: string
          vehicle_id: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          client_name?: string | null
          created_at?: string | null
          created_by?: string | null
          end_time?: string | null
          gps_trail?: Json | null
          id?: string
          notes?: string | null
          officer_id: string
          patrol_id: string
          patrol_type: string
          priority?: string
          route_name?: string | null
          site_name: string
          start_time: string
          status?: string
          vehicle_id: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          client_name?: string | null
          created_at?: string | null
          created_by?: string | null
          end_time?: string | null
          gps_trail?: Json | null
          id?: string
          notes?: string | null
          officer_id?: string
          patrol_id?: string
          patrol_type?: string
          priority?: string
          route_name?: string | null
          site_name?: string
          start_time?: string
          status?: string
          vehicle_id?: string
        }
        Relationships: []
      }
      operator_statuses: {
        Row: {
          break_started_at: string | null
          calls_handled_today: number
          created_at: string
          current_call_id: string | null
          id: string
          operator_id: string
          status: Database["public"]["Enums"]["operator_status_type"]
          status_changed_at: string
          updated_at: string
        }
        Insert: {
          break_started_at?: string | null
          calls_handled_today?: number
          created_at?: string
          current_call_id?: string | null
          id?: string
          operator_id: string
          status?: Database["public"]["Enums"]["operator_status_type"]
          status_changed_at?: string
          updated_at?: string
        }
        Update: {
          break_started_at?: string | null
          calls_handled_today?: number
          created_at?: string
          current_call_id?: string | null
          id?: string
          operator_id?: string
          status?: Database["public"]["Enums"]["operator_status_type"]
          status_changed_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "operator_statuses_current_call_id_fkey"
            columns: ["current_call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operator_statuses_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patrol_checkpoints: {
        Row: {
          checkpoint_id: string
          control_room_operator: string | null
          created_at: string | null
          entry_number: string | null
          gps_coordinates: string | null
          guard_on_duty_name: string | null
          guard_rfid_id: string | null
          id: string
          incident_flag: boolean | null
          media_attachments: Json | null
          next_scheduled_patrol: string | null
          notes: string | null
          observation: string | null
          patrol_id: string
          patrol_type: string | null
          scan_method: string
          scanned_at: string | null
          scanned_by: string
          supervisor_signature: string | null
          verification_status: string | null
        }
        Insert: {
          checkpoint_id: string
          control_room_operator?: string | null
          created_at?: string | null
          entry_number?: string | null
          gps_coordinates?: string | null
          guard_on_duty_name?: string | null
          guard_rfid_id?: string | null
          id?: string
          incident_flag?: boolean | null
          media_attachments?: Json | null
          next_scheduled_patrol?: string | null
          notes?: string | null
          observation?: string | null
          patrol_id: string
          patrol_type?: string | null
          scan_method: string
          scanned_at?: string | null
          scanned_by: string
          supervisor_signature?: string | null
          verification_status?: string | null
        }
        Update: {
          checkpoint_id?: string
          control_room_operator?: string | null
          created_at?: string | null
          entry_number?: string | null
          gps_coordinates?: string | null
          guard_on_duty_name?: string | null
          guard_rfid_id?: string | null
          id?: string
          incident_flag?: boolean | null
          media_attachments?: Json | null
          next_scheduled_patrol?: string | null
          notes?: string | null
          observation?: string | null
          patrol_id?: string
          patrol_type?: string | null
          scan_method?: string
          scanned_at?: string | null
          scanned_by?: string
          supervisor_signature?: string | null
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patrol_checkpoints_checkpoint_id_fkey"
            columns: ["checkpoint_id"]
            isOneToOne: false
            referencedRelation: "checkpoints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patrol_checkpoints_patrol_id_fkey"
            columns: ["patrol_id"]
            isOneToOne: false
            referencedRelation: "patrols"
            referencedColumns: ["id"]
          },
        ]
      }
      patrols: {
        Row: {
          client_name: string | null
          created_at: string
          created_by: string | null
          end_time: string | null
          frequency: string | null
          guard_id: string
          id: string
          k9_assigned: string | null
          next_patrol_time: string | null
          notes: string | null
          patrol_date: string | null
          patrol_id: string | null
          patrol_type: string | null
          route_data: Json | null
          shift_end: string | null
          shift_start: string | null
          site_name: string
          start_time: string
          status: string
          supervisor_rfid_id: string | null
          vehicle_assigned: string | null
        }
        Insert: {
          client_name?: string | null
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          frequency?: string | null
          guard_id: string
          id?: string
          k9_assigned?: string | null
          next_patrol_time?: string | null
          notes?: string | null
          patrol_date?: string | null
          patrol_id?: string | null
          patrol_type?: string | null
          route_data?: Json | null
          shift_end?: string | null
          shift_start?: string | null
          site_name: string
          start_time?: string
          status?: string
          supervisor_rfid_id?: string | null
          vehicle_assigned?: string | null
        }
        Update: {
          client_name?: string | null
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          frequency?: string | null
          guard_id?: string
          id?: string
          k9_assigned?: string | null
          next_patrol_time?: string | null
          notes?: string | null
          patrol_date?: string | null
          patrol_id?: string | null
          patrol_type?: string | null
          route_data?: Json | null
          shift_end?: string | null
          shift_start?: string | null
          site_name?: string
          start_time?: string
          status?: string
          supervisor_rfid_id?: string | null
          vehicle_assigned?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patrols_guard_id_fkey"
            columns: ["guard_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          phone: string | null
          photo_url: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name: string
          id: string
          phone?: string | null
          photo_url?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          photo_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          generated_at: string | null
          generated_by: string | null
          id: string
          parameters: Json | null
          report_data: Json | null
          report_title: string
          report_type: string
        }
        Insert: {
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          parameters?: Json | null
          report_data?: Json | null
          report_title: string
          report_type: string
        }
        Update: {
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          parameters?: Json | null
          report_data?: Json | null
          report_title?: string
          report_type?: string
        }
        Relationships: []
      }
      risk_assessments: {
        Row: {
          assessed_by: string | null
          assessment_date: string
          client_id: string
          created_at: string | null
          findings: string | null
          id: string
          next_due_date: string
          recommendations: string | null
          risk_score: number | null
          risk_tier: Database["public"]["Enums"]["risk_tier"]
          risk_trend: Database["public"]["Enums"]["risk_trend"] | null
          site_id: string | null
        }
        Insert: {
          assessed_by?: string | null
          assessment_date: string
          client_id: string
          created_at?: string | null
          findings?: string | null
          id?: string
          next_due_date: string
          recommendations?: string | null
          risk_score?: number | null
          risk_tier: Database["public"]["Enums"]["risk_tier"]
          risk_trend?: Database["public"]["Enums"]["risk_trend"] | null
          site_id?: string | null
        }
        Update: {
          assessed_by?: string | null
          assessment_date?: string
          client_id?: string
          created_at?: string | null
          findings?: string | null
          id?: string
          next_due_date?: string
          recommendations?: string | null
          risk_score?: number | null
          risk_tier?: Database["public"]["Enums"]["risk_tier"]
          risk_trend?: Database["public"]["Enums"]["risk_trend"] | null
          site_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "risk_assessments_assessed_by_fkey"
            columns: ["assessed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_assessments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_assessments_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          client_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          shift_date: string
          shift_end: string
          shift_start: string
          shift_type: string
          site_id: string | null
          staff_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          shift_date: string
          shift_end: string
          shift_start: string
          shift_type: string
          site_id?: string | null
          staff_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          shift_date?: string
          shift_end?: string
          shift_start?: string
          shift_type?: string
          site_id?: string | null
          staff_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedules_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          client_id: string | null
          created_at: string | null
          description: string | null
          end_time: string | null
          event_date: string
          event_name: string
          event_type: string
          expected_attendance: number | null
          id: string
          security_level: string | null
          special_requirements: string | null
          staff_assigned: number | null
          staff_required: number | null
          start_time: string | null
          status: string | null
          updated_at: string | null
          venue: string
          venue_address: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          event_date: string
          event_name: string
          event_type: string
          expected_attendance?: number | null
          id?: string
          security_level?: string | null
          special_requirements?: string | null
          staff_assigned?: number | null
          staff_required?: number | null
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
          venue: string
          venue_address?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          event_date?: string
          event_name?: string
          event_type?: string
          expected_attendance?: number | null
          id?: string
          security_level?: string | null
          special_requirements?: string | null
          staff_assigned?: number | null
          staff_required?: number | null
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
          venue?: string
          venue_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_logs: {
        Row: {
          alarms_acknowledged: number | null
          created_at: string | null
          dispatches_made: number | null
          handover_notes: string | null
          id: string
          incidents_handled: number | null
          incoming_operator_signed_at: string | null
          incoming_operator_viewed: boolean | null
          issues_flagged: string | null
          operator_id: string
          shift_end: string | null
          shift_id: string
          shift_start: string
          signed_off_at: string | null
          signed_off_by: string | null
          sla_breaches: number | null
          summary_auto_generated: boolean | null
          supervisor_id: string | null
          updated_at: string | null
        }
        Insert: {
          alarms_acknowledged?: number | null
          created_at?: string | null
          dispatches_made?: number | null
          handover_notes?: string | null
          id?: string
          incidents_handled?: number | null
          incoming_operator_signed_at?: string | null
          incoming_operator_viewed?: boolean | null
          issues_flagged?: string | null
          operator_id: string
          shift_end?: string | null
          shift_id: string
          shift_start: string
          signed_off_at?: string | null
          signed_off_by?: string | null
          sla_breaches?: number | null
          summary_auto_generated?: boolean | null
          supervisor_id?: string | null
          updated_at?: string | null
        }
        Update: {
          alarms_acknowledged?: number | null
          created_at?: string | null
          dispatches_made?: number | null
          handover_notes?: string | null
          id?: string
          incidents_handled?: number | null
          incoming_operator_signed_at?: string | null
          incoming_operator_viewed?: boolean | null
          issues_flagged?: string | null
          operator_id?: string
          shift_end?: string | null
          shift_id?: string
          shift_start?: string
          signed_off_at?: string | null
          signed_off_by?: string | null
          sla_breaches?: number | null
          summary_auto_generated?: boolean | null
          supervisor_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sites: {
        Row: {
          address: string
          client_id: string
          created_at: string | null
          created_by: string | null
          gps_coordinates: string | null
          id: string
          site_commander: string | null
          site_name: string
          site_type: string | null
          updated_at: string | null
        }
        Insert: {
          address: string
          client_id: string
          created_at?: string | null
          created_by?: string | null
          gps_coordinates?: string | null
          id?: string
          site_commander?: string | null
          site_name: string
          site_type?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          gps_coordinates?: string | null
          id?: string
          site_commander?: string | null
          site_name?: string
          site_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_messages: {
        Row: {
          created_at: string
          delivery_status: string | null
          id: string
          is_incoming: boolean
          message_text: string
          recipient_number: string
          sender_number: string
          ticket_id: string | null
        }
        Insert: {
          created_at?: string
          delivery_status?: string | null
          id?: string
          is_incoming?: boolean
          message_text: string
          recipient_number: string
          sender_number: string
          ticket_id?: string | null
        }
        Update: {
          created_at?: string
          delivery_status?: string | null
          id?: string
          is_incoming?: boolean
          message_text?: string
          recipient_number?: string
          sender_number?: string
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "communication_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      sop_configurations: {
        Row: {
          active: boolean | null
          auto_create_investigation: boolean | null
          created_at: string | null
          default_severity: string
          default_units_required: number | null
          escalation_time_minutes: number | null
          id: string
          incident_type: string
          mandatory_fields: Json | null
          requires_cctv_review: boolean | null
          requires_police_notification: boolean | null
          requires_supervisor_approval: boolean | null
          response_time_target_minutes: number
          steps: Json
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          auto_create_investigation?: boolean | null
          created_at?: string | null
          default_severity: string
          default_units_required?: number | null
          escalation_time_minutes?: number | null
          id?: string
          incident_type: string
          mandatory_fields?: Json | null
          requires_cctv_review?: boolean | null
          requires_police_notification?: boolean | null
          requires_supervisor_approval?: boolean | null
          response_time_target_minutes: number
          steps?: Json
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          auto_create_investigation?: boolean | null
          created_at?: string | null
          default_severity?: string
          default_units_required?: number | null
          escalation_time_minutes?: number | null
          id?: string
          incident_type?: string
          mandatory_fields?: Json | null
          requires_cctv_review?: boolean | null
          requires_police_notification?: boolean | null
          requires_supervisor_approval?: boolean | null
          response_time_target_minutes?: number
          steps?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      sos_alerts: {
        Row: {
          alert_number: string
          created_at: string | null
          gps_lat: number
          gps_lng: number
          id: string
          officer_id: string
          patrol_id: string | null
          resolution_notes: string | null
          resolution_time: string | null
          responded_by: string | null
          response_time: string | null
          status: string
          triggered_at: string
          vehicle_id: string
        }
        Insert: {
          alert_number: string
          created_at?: string | null
          gps_lat: number
          gps_lng: number
          id?: string
          officer_id: string
          patrol_id?: string | null
          resolution_notes?: string | null
          resolution_time?: string | null
          responded_by?: string | null
          response_time?: string | null
          status?: string
          triggered_at?: string
          vehicle_id: string
        }
        Update: {
          alert_number?: string
          created_at?: string | null
          gps_lat?: number
          gps_lng?: number
          id?: string
          officer_id?: string
          patrol_id?: string | null
          resolution_notes?: string | null
          resolution_time?: string | null
          responded_by?: string | null
          response_time?: string | null
          status?: string
          triggered_at?: string
          vehicle_id?: string
        }
        Relationships: []
      }
      staff: {
        Row: {
          contract_type: string | null
          created_at: string | null
          created_by: string | null
          current_client: string | null
          current_site: string | null
          date_employed: string
          duty_category: string | null
          full_name: string
          id: string
          kra_pin: string | null
          national_id: string
          next_of_kin_name: string | null
          next_of_kin_phone: string | null
          nhif_number: string | null
          nssf_number: string | null
          phone: string
          phone_secondary: string | null
          photo_url: string | null
          position: string
          probation_end_date: string | null
          rank: string | null
          rfid_card_number: string | null
          staff_id: string
          status: Database["public"]["Enums"]["staff_status"] | null
          updated_at: string | null
        }
        Insert: {
          contract_type?: string | null
          created_at?: string | null
          created_by?: string | null
          current_client?: string | null
          current_site?: string | null
          date_employed: string
          duty_category?: string | null
          full_name: string
          id?: string
          kra_pin?: string | null
          national_id: string
          next_of_kin_name?: string | null
          next_of_kin_phone?: string | null
          nhif_number?: string | null
          nssf_number?: string | null
          phone: string
          phone_secondary?: string | null
          photo_url?: string | null
          position: string
          probation_end_date?: string | null
          rank?: string | null
          rfid_card_number?: string | null
          staff_id: string
          status?: Database["public"]["Enums"]["staff_status"] | null
          updated_at?: string | null
        }
        Update: {
          contract_type?: string | null
          created_at?: string | null
          created_by?: string | null
          current_client?: string | null
          current_site?: string | null
          date_employed?: string
          duty_category?: string | null
          full_name?: string
          id?: string
          kra_pin?: string | null
          national_id?: string
          next_of_kin_name?: string | null
          next_of_kin_phone?: string | null
          nhif_number?: string | null
          nssf_number?: string | null
          phone?: string
          phone_secondary?: string | null
          photo_url?: string | null
          position?: string
          probation_end_date?: string | null
          rank?: string | null
          rfid_card_number?: string | null
          staff_id?: string
          status?: Database["public"]["Enums"]["staff_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_certifications: {
        Row: {
          alert_days_before: number | null
          certification_number: string | null
          certification_type: string
          created_at: string
          document_id: string | null
          expiry_date: string
          id: string
          issue_date: string
          issuing_authority: string | null
          last_alert_sent: string | null
          notes: string | null
          staff_id: string
          status: Database["public"]["Enums"]["document_status"] | null
          updated_at: string
        }
        Insert: {
          alert_days_before?: number | null
          certification_number?: string | null
          certification_type: string
          created_at?: string
          document_id?: string | null
          expiry_date: string
          id?: string
          issue_date: string
          issuing_authority?: string | null
          last_alert_sent?: string | null
          notes?: string | null
          staff_id: string
          status?: Database["public"]["Enums"]["document_status"] | null
          updated_at?: string
        }
        Update: {
          alert_days_before?: number | null
          certification_number?: string | null
          certification_type?: string
          created_at?: string
          document_id?: string | null
          expiry_date?: string
          id?: string
          issue_date?: string
          issuing_authority?: string | null
          last_alert_sent?: string | null
          notes?: string | null
          staff_id?: string
          status?: Database["public"]["Enums"]["document_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_certifications_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_certifications_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      status_history: {
        Row: {
          authorized_by: string | null
          created_at: string | null
          created_by: string | null
          effective_date: string
          form_number: string | null
          id: string
          new_status: Database["public"]["Enums"]["staff_status"]
          previous_status: Database["public"]["Enums"]["staff_status"] | null
          reason: string | null
          remarks: string | null
          reported_by: string
          staff_id: string
        }
        Insert: {
          authorized_by?: string | null
          created_at?: string | null
          created_by?: string | null
          effective_date: string
          form_number?: string | null
          id?: string
          new_status: Database["public"]["Enums"]["staff_status"]
          previous_status?: Database["public"]["Enums"]["staff_status"] | null
          reason?: string | null
          remarks?: string | null
          reported_by: string
          staff_id: string
        }
        Update: {
          authorized_by?: string | null
          created_at?: string | null
          created_by?: string | null
          effective_date?: string
          form_number?: string | null
          id?: string
          new_status?: Database["public"]["Enums"]["staff_status"]
          previous_status?: Database["public"]["Enums"]["staff_status"] | null
          reason?: string | null
          remarks?: string | null
          reported_by?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "status_history_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "status_history_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      strategic_advisories: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          affected_client_ids: string[] | null
          attachments: Json | null
          category: string
          client_notification_sent_at: string | null
          client_notified: boolean | null
          confidence_score: number | null
          created_at: string
          created_by: string | null
          current_owner_role: string | null
          description: string | null
          escalated_at: string | null
          escalated_by: string | null
          escalated_to: string | null
          id: string
          incident_id: string
          is_escalated: boolean | null
          location_lat: number | null
          location_lon: number | null
          location_scope_hierarchy: string[] | null
          proximate_poi: string | null
          recommended_action: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          sla_breached: boolean | null
          sla_deadline: string | null
          sla_target_minutes: number | null
          sources: Json | null
          status: string
          sub_category: string | null
          tenant_id: string
          timestamp_detected: string
          timestamp_updated: string
          title: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          affected_client_ids?: string[] | null
          attachments?: Json | null
          category: string
          client_notification_sent_at?: string | null
          client_notified?: boolean | null
          confidence_score?: number | null
          created_at?: string
          created_by?: string | null
          current_owner_role?: string | null
          description?: string | null
          escalated_at?: string | null
          escalated_by?: string | null
          escalated_to?: string | null
          id?: string
          incident_id: string
          is_escalated?: boolean | null
          location_lat?: number | null
          location_lon?: number | null
          location_scope_hierarchy?: string[] | null
          proximate_poi?: string | null
          recommended_action?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          sla_breached?: boolean | null
          sla_deadline?: string | null
          sla_target_minutes?: number | null
          sources?: Json | null
          status?: string
          sub_category?: string | null
          tenant_id?: string
          timestamp_detected?: string
          timestamp_updated?: string
          title: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          affected_client_ids?: string[] | null
          attachments?: Json | null
          category?: string
          client_notification_sent_at?: string | null
          client_notified?: boolean | null
          confidence_score?: number | null
          created_at?: string
          created_by?: string | null
          current_owner_role?: string | null
          description?: string | null
          escalated_at?: string | null
          escalated_by?: string | null
          escalated_to?: string | null
          id?: string
          incident_id?: string
          is_escalated?: boolean | null
          location_lat?: number | null
          location_lon?: number | null
          location_scope_hierarchy?: string[] | null
          proximate_poi?: string | null
          recommended_action?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          sla_breached?: boolean | null
          sla_deadline?: string | null
          sla_target_minutes?: number | null
          sources?: Json | null
          status?: string
          sub_category?: string | null
          tenant_id?: string
          timestamp_detected?: string
          timestamp_updated?: string
          title?: string
        }
        Relationships: []
      }
      strategic_advisory_audit: {
        Row: {
          action: string
          action_details: Json | null
          advisory_id: string
          id: string
          ip_address: string | null
          new_state: Json | null
          performed_at: string
          performed_by: string
          previous_state: Json | null
          user_agent: string | null
        }
        Insert: {
          action: string
          action_details?: Json | null
          advisory_id: string
          id?: string
          ip_address?: string | null
          new_state?: Json | null
          performed_at?: string
          performed_by: string
          previous_state?: Json | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          action_details?: Json | null
          advisory_id?: string
          id?: string
          ip_address?: string | null
          new_state?: Json | null
          performed_at?: string
          performed_by?: string
          previous_state?: Json | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "strategic_advisory_audit_advisory_id_fkey"
            columns: ["advisory_id"]
            isOneToOne: false
            referencedRelation: "strategic_advisories"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          client_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          id: string
          priority: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          subject: string
          ticket_number: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: string
          priority?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          subject: string
          ticket_number?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: string
          priority?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          subject?: string
          ticket_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          category: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          priority: string | null
          status: string | null
          title: string
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title: string
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title?: string
        }
        Relationships: []
      }
      technical_client_sites: {
        Row: {
          access_instructions: string | null
          aging_equipment_count: number | null
          average_response_time_hours: number | null
          client_id: string | null
          created_at: string | null
          critical_equipment_count: number | null
          dependence_severity: string | null
          emergency_procedures: string | null
          fault_frequency_30d: number | null
          fault_frequency_90d: number | null
          id: string
          last_incident_date: string | null
          last_maintenance_date: string | null
          maintenance_compliance_rate: number | null
          maintenance_responsiveness_score: number | null
          next_scheduled_maintenance: string | null
          risk_exposure_rating: string | null
          site_drawings: Json | null
          site_id: string | null
          special_requirements: string | null
          system_complexity_index: number | null
          technical_contact_email: string | null
          technical_contact_name: string | null
          technical_contact_phone: string | null
          total_equipment_count: number | null
          updated_at: string | null
        }
        Insert: {
          access_instructions?: string | null
          aging_equipment_count?: number | null
          average_response_time_hours?: number | null
          client_id?: string | null
          created_at?: string | null
          critical_equipment_count?: number | null
          dependence_severity?: string | null
          emergency_procedures?: string | null
          fault_frequency_30d?: number | null
          fault_frequency_90d?: number | null
          id?: string
          last_incident_date?: string | null
          last_maintenance_date?: string | null
          maintenance_compliance_rate?: number | null
          maintenance_responsiveness_score?: number | null
          next_scheduled_maintenance?: string | null
          risk_exposure_rating?: string | null
          site_drawings?: Json | null
          site_id?: string | null
          special_requirements?: string | null
          system_complexity_index?: number | null
          technical_contact_email?: string | null
          technical_contact_name?: string | null
          technical_contact_phone?: string | null
          total_equipment_count?: number | null
          updated_at?: string | null
        }
        Update: {
          access_instructions?: string | null
          aging_equipment_count?: number | null
          average_response_time_hours?: number | null
          client_id?: string | null
          created_at?: string | null
          critical_equipment_count?: number | null
          dependence_severity?: string | null
          emergency_procedures?: string | null
          fault_frequency_30d?: number | null
          fault_frequency_90d?: number | null
          id?: string
          last_incident_date?: string | null
          last_maintenance_date?: string | null
          maintenance_compliance_rate?: number | null
          maintenance_responsiveness_score?: number | null
          next_scheduled_maintenance?: string | null
          risk_exposure_rating?: string | null
          site_drawings?: Json | null
          site_id?: string | null
          special_requirements?: string | null
          system_complexity_index?: number | null
          technical_contact_email?: string | null
          technical_contact_name?: string | null
          technical_contact_phone?: string | null
          total_equipment_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "technical_client_sites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technical_client_sites_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      technical_equipment: {
        Row: {
          client_id: string | null
          created_at: string | null
          created_by: string | null
          equipment_category: string
          equipment_id: string
          equipment_type: string
          gps_lat: number | null
          gps_lng: number | null
          health_score: number | null
          id: string
          installation_date: string | null
          last_maintenance_date: string | null
          lifecycle_stage: string | null
          location_description: string
          manufacturer: string | null
          model_number: string | null
          next_maintenance_due: string | null
          notes: string | null
          serial_number: string | null
          site_id: string | null
          specifications: Json | null
          status: string
          updated_at: string | null
          warranty_expiry: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          equipment_category: string
          equipment_id: string
          equipment_type: string
          gps_lat?: number | null
          gps_lng?: number | null
          health_score?: number | null
          id?: string
          installation_date?: string | null
          last_maintenance_date?: string | null
          lifecycle_stage?: string | null
          location_description: string
          manufacturer?: string | null
          model_number?: string | null
          next_maintenance_due?: string | null
          notes?: string | null
          serial_number?: string | null
          site_id?: string | null
          specifications?: Json | null
          status?: string
          updated_at?: string | null
          warranty_expiry?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          equipment_category?: string
          equipment_id?: string
          equipment_type?: string
          gps_lat?: number | null
          gps_lng?: number | null
          health_score?: number | null
          id?: string
          installation_date?: string | null
          last_maintenance_date?: string | null
          lifecycle_stage?: string | null
          location_description?: string
          manufacturer?: string | null
          model_number?: string | null
          next_maintenance_due?: string | null
          notes?: string | null
          serial_number?: string | null
          site_id?: string | null
          specifications?: Json | null
          status?: string
          updated_at?: string | null
          warranty_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "technical_equipment_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technical_equipment_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      technical_inspections: {
        Row: {
          client_id: string | null
          compliance_score: number | null
          corrective_actions: string | null
          created_at: string | null
          defects_found: Json | null
          equipment_id: string | null
          findings: string | null
          id: string
          inspection_checklist: Json
          inspection_date: string
          inspection_id: string
          inspection_type: string
          inspector_id: string | null
          passed: boolean | null
          photos: Json | null
          reinspection_date: string | null
          reinspection_required: boolean | null
          signed_at: string | null
          signed_by: string | null
          site_id: string | null
          status: string | null
          work_order_id: string | null
        }
        Insert: {
          client_id?: string | null
          compliance_score?: number | null
          corrective_actions?: string | null
          created_at?: string | null
          defects_found?: Json | null
          equipment_id?: string | null
          findings?: string | null
          id?: string
          inspection_checklist: Json
          inspection_date: string
          inspection_id: string
          inspection_type: string
          inspector_id?: string | null
          passed?: boolean | null
          photos?: Json | null
          reinspection_date?: string | null
          reinspection_required?: boolean | null
          signed_at?: string | null
          signed_by?: string | null
          site_id?: string | null
          status?: string | null
          work_order_id?: string | null
        }
        Update: {
          client_id?: string | null
          compliance_score?: number | null
          corrective_actions?: string | null
          created_at?: string | null
          defects_found?: Json | null
          equipment_id?: string | null
          findings?: string | null
          id?: string
          inspection_checklist?: Json
          inspection_date?: string
          inspection_id?: string
          inspection_type?: string
          inspector_id?: string | null
          passed?: boolean | null
          photos?: Json | null
          reinspection_date?: string | null
          reinspection_required?: boolean | null
          signed_at?: string | null
          signed_by?: string | null
          site_id?: string | null
          status?: string | null
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "technical_inspections_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technical_inspections_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "technical_equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technical_inspections_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technical_inspections_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "technical_work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      technical_maintenance_schedules: {
        Row: {
          assigned_technician: string | null
          client_id: string | null
          created_at: string | null
          created_by: string | null
          equipment_id: string | null
          estimated_hours: number | null
          frequency: string
          frequency_days: number
          id: string
          last_service_date: string | null
          maintenance_checklist: Json | null
          maintenance_type: string
          next_service_date: string
          notes: string | null
          priority: string | null
          schedule_id: string
          service_category: string
          site_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_technician?: string | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          equipment_id?: string | null
          estimated_hours?: number | null
          frequency: string
          frequency_days: number
          id?: string
          last_service_date?: string | null
          maintenance_checklist?: Json | null
          maintenance_type: string
          next_service_date: string
          notes?: string | null
          priority?: string | null
          schedule_id: string
          service_category: string
          site_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_technician?: string | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          equipment_id?: string | null
          estimated_hours?: number | null
          frequency?: string
          frequency_days?: number
          id?: string
          last_service_date?: string | null
          maintenance_checklist?: Json | null
          maintenance_type?: string
          next_service_date?: string
          notes?: string | null
          priority?: string | null
          schedule_id?: string
          service_category?: string
          site_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "technical_maintenance_schedules_assigned_technician_fkey"
            columns: ["assigned_technician"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technical_maintenance_schedules_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technical_maintenance_schedules_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "technical_equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technical_maintenance_schedules_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      technical_performance_metrics: {
        Row: {
          average_completion_time_hours: number | null
          average_response_time_hours: number | null
          calculated_at: string | null
          calculated_by: string | null
          certifications_acquired: number | null
          client_satisfaction_average: number | null
          commendations: number | null
          disciplinary_actions: number | null
          id: string
          jobs_completed: number | null
          jobs_pending: number | null
          performance_rating: string | null
          period_end: string
          period_start: string
          quality_score_average: number | null
          repeat_fault_involvement: number | null
          rework_count: number | null
          safety_compliance_rate: number | null
          sla_compliance_rate: number | null
          supervisor_notes: string | null
          technician_id: string | null
          total_jobs_assigned: number | null
          training_courses_completed: number | null
        }
        Insert: {
          average_completion_time_hours?: number | null
          average_response_time_hours?: number | null
          calculated_at?: string | null
          calculated_by?: string | null
          certifications_acquired?: number | null
          client_satisfaction_average?: number | null
          commendations?: number | null
          disciplinary_actions?: number | null
          id?: string
          jobs_completed?: number | null
          jobs_pending?: number | null
          performance_rating?: string | null
          period_end: string
          period_start: string
          quality_score_average?: number | null
          repeat_fault_involvement?: number | null
          rework_count?: number | null
          safety_compliance_rate?: number | null
          sla_compliance_rate?: number | null
          supervisor_notes?: string | null
          technician_id?: string | null
          total_jobs_assigned?: number | null
          training_courses_completed?: number | null
        }
        Update: {
          average_completion_time_hours?: number | null
          average_response_time_hours?: number | null
          calculated_at?: string | null
          calculated_by?: string | null
          certifications_acquired?: number | null
          client_satisfaction_average?: number | null
          commendations?: number | null
          disciplinary_actions?: number | null
          id?: string
          jobs_completed?: number | null
          jobs_pending?: number | null
          performance_rating?: string | null
          period_end?: string
          period_start?: string
          quality_score_average?: number | null
          repeat_fault_involvement?: number | null
          rework_count?: number | null
          safety_compliance_rate?: number | null
          sla_compliance_rate?: number | null
          supervisor_notes?: string | null
          technician_id?: string | null
          total_jobs_assigned?: number | null
          training_courses_completed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "technical_performance_metrics_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      technical_risk_assessments: {
        Row: {
          action_deadline: string | null
          action_owner: string | null
          assessment_id: string
          client_id: string | null
          closed_at: string | null
          control_effectiveness: string | null
          created_at: string | null
          current_controls: string | null
          equipment_id: string | null
          id: string
          identified_at: string | null
          identified_by: string | null
          impact: string
          mitigation_actions: string | null
          probability: string
          residual_risk: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          risk_category: string
          risk_description: string
          risk_score: number | null
          risk_title: string
          risk_type: string
          site_id: string | null
          status: string | null
        }
        Insert: {
          action_deadline?: string | null
          action_owner?: string | null
          assessment_id: string
          client_id?: string | null
          closed_at?: string | null
          control_effectiveness?: string | null
          created_at?: string | null
          current_controls?: string | null
          equipment_id?: string | null
          id?: string
          identified_at?: string | null
          identified_by?: string | null
          impact: string
          mitigation_actions?: string | null
          probability: string
          residual_risk?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_category: string
          risk_description: string
          risk_score?: number | null
          risk_title: string
          risk_type: string
          site_id?: string | null
          status?: string | null
        }
        Update: {
          action_deadline?: string | null
          action_owner?: string | null
          assessment_id?: string
          client_id?: string | null
          closed_at?: string | null
          control_effectiveness?: string | null
          created_at?: string | null
          current_controls?: string | null
          equipment_id?: string | null
          id?: string
          identified_at?: string | null
          identified_by?: string | null
          impact?: string
          mitigation_actions?: string | null
          probability?: string
          residual_risk?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_category?: string
          risk_description?: string
          risk_score?: number | null
          risk_title?: string
          risk_type?: string
          site_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "technical_risk_assessments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technical_risk_assessments_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "technical_equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technical_risk_assessments_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      technical_service_history: {
        Row: {
          action_taken: string | null
          after_health_score: number | null
          before_health_score: number | null
          cost: number | null
          downtime_hours: number | null
          equipment_id: string | null
          findings: string | null
          id: string
          logged_at: string | null
          logged_by: string | null
          parts_replaced: Json | null
          photos: Json | null
          service_date: string
          service_type: string
          technician_id: string | null
          work_order_id: string | null
        }
        Insert: {
          action_taken?: string | null
          after_health_score?: number | null
          before_health_score?: number | null
          cost?: number | null
          downtime_hours?: number | null
          equipment_id?: string | null
          findings?: string | null
          id?: string
          logged_at?: string | null
          logged_by?: string | null
          parts_replaced?: Json | null
          photos?: Json | null
          service_date: string
          service_type: string
          technician_id?: string | null
          work_order_id?: string | null
        }
        Update: {
          action_taken?: string | null
          after_health_score?: number | null
          before_health_score?: number | null
          cost?: number | null
          downtime_hours?: number | null
          equipment_id?: string | null
          findings?: string | null
          id?: string
          logged_at?: string | null
          logged_by?: string | null
          parts_replaced?: Json | null
          photos?: Json | null
          service_date?: string
          service_type?: string
          technician_id?: string | null
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "technical_service_history_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "technical_equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technical_service_history_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technical_service_history_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "technical_work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      technical_work_orders: {
        Row: {
          action_taken: string | null
          approved_at: string | null
          approved_by: string | null
          assigned_at: string | null
          assigned_by: string | null
          assigned_to: string | null
          attachments: Json | null
          client_acceptance: string | null
          client_acceptance_date: string | null
          client_id: string | null
          client_signature: string | null
          completed_at: string | null
          compliance_checklist: Json | null
          cost: number | null
          created_at: string | null
          description: string
          equipment_id: string | null
          findings: string | null
          hours_spent: number | null
          id: string
          parts_used: Json | null
          photos: Json | null
          priority: string
          quality_score: number | null
          requested_at: string | null
          requested_by: string | null
          scheduled_date: string | null
          scheduled_time: string | null
          service_category: string
          site_id: string | null
          sla_breached: boolean | null
          sla_deadline: string | null
          sla_target_hours: number | null
          started_at: string | null
          status: string
          supervisor_notes: string | null
          technician_notes: string | null
          title: string
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
          work_order_number: string
          work_order_type: string
          workflow_stage: string
        }
        Insert: {
          action_taken?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          attachments?: Json | null
          client_acceptance?: string | null
          client_acceptance_date?: string | null
          client_id?: string | null
          client_signature?: string | null
          completed_at?: string | null
          compliance_checklist?: Json | null
          cost?: number | null
          created_at?: string | null
          description: string
          equipment_id?: string | null
          findings?: string | null
          hours_spent?: number | null
          id?: string
          parts_used?: Json | null
          photos?: Json | null
          priority?: string
          quality_score?: number | null
          requested_at?: string | null
          requested_by?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          service_category: string
          site_id?: string | null
          sla_breached?: boolean | null
          sla_deadline?: string | null
          sla_target_hours?: number | null
          started_at?: string | null
          status?: string
          supervisor_notes?: string | null
          technician_notes?: string | null
          title: string
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
          work_order_number: string
          work_order_type: string
          workflow_stage?: string
        }
        Update: {
          action_taken?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          attachments?: Json | null
          client_acceptance?: string | null
          client_acceptance_date?: string | null
          client_id?: string | null
          client_signature?: string | null
          completed_at?: string | null
          compliance_checklist?: Json | null
          cost?: number | null
          created_at?: string | null
          description?: string
          equipment_id?: string | null
          findings?: string | null
          hours_spent?: number | null
          id?: string
          parts_used?: Json | null
          photos?: Json | null
          priority?: string
          quality_score?: number | null
          requested_at?: string | null
          requested_by?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          service_category?: string
          site_id?: string | null
          sla_breached?: boolean | null
          sla_deadline?: string | null
          sla_target_hours?: number | null
          started_at?: string | null
          status?: string
          supervisor_notes?: string | null
          technician_notes?: string | null
          title?: string
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
          work_order_number?: string
          work_order_type?: string
          workflow_stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "technical_work_orders_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technical_work_orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technical_work_orders_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "technical_equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technical_work_orders_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      training_programs: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          duration_hours: number | null
          id: string
          is_mandatory: boolean | null
          name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          is_mandatory?: boolean | null
          name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          is_mandatory?: boolean | null
          name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      training_records: {
        Row: {
          certificate_url: string | null
          completion_date: string | null
          created_at: string | null
          id: string
          notes: string | null
          passed: boolean | null
          program_id: string | null
          score: number | null
          session_id: string | null
          staff_id: string | null
        }
        Insert: {
          certificate_url?: string | null
          completion_date?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          passed?: boolean | null
          program_id?: string | null
          score?: number | null
          session_id?: string | null
          staff_id?: string | null
        }
        Update: {
          certificate_url?: string | null
          completion_date?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          passed?: boolean | null
          program_id?: string | null
          score?: number | null
          session_id?: string | null
          staff_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_records_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_records_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      training_sessions: {
        Row: {
          created_at: string | null
          end_time: string | null
          enrolled_count: number | null
          id: string
          max_capacity: number | null
          notes: string | null
          program_id: string | null
          session_date: string
          session_id: string
          start_time: string | null
          status: string | null
          trainer_name: string | null
          venue: string | null
        }
        Insert: {
          created_at?: string | null
          end_time?: string | null
          enrolled_count?: number | null
          id?: string
          max_capacity?: number | null
          notes?: string | null
          program_id?: string | null
          session_date: string
          session_id: string
          start_time?: string | null
          status?: string | null
          trainer_name?: string | null
          venue?: string | null
        }
        Update: {
          created_at?: string | null
          end_time?: string | null
          enrolled_count?: number | null
          id?: string
          max_capacity?: number | null
          notes?: string | null
          program_id?: string | null
          session_date?: string
          session_id?: string
          start_time?: string | null
          status?: string | null
          trainer_name?: string | null
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          assigned_crew_ids: Json | null
          call_sign: string | null
          created_at: string | null
          current_assignment: string | null
          current_officer_id: string | null
          fuel_level: number | null
          id: string
          is_active: boolean | null
          last_gps_lat: number | null
          last_gps_lng: number | null
          last_gps_update: string | null
          mileage: number | null
          region: string | null
          registration_number: string
          status: string
          updated_at: string | null
          vehicle_id: string
          vehicle_type: string
        }
        Insert: {
          assigned_crew_ids?: Json | null
          call_sign?: string | null
          created_at?: string | null
          current_assignment?: string | null
          current_officer_id?: string | null
          fuel_level?: number | null
          id?: string
          is_active?: boolean | null
          last_gps_lat?: number | null
          last_gps_lng?: number | null
          last_gps_update?: string | null
          mileage?: number | null
          region?: string | null
          registration_number: string
          status?: string
          updated_at?: string | null
          vehicle_id: string
          vehicle_type: string
        }
        Update: {
          assigned_crew_ids?: Json | null
          call_sign?: string | null
          created_at?: string | null
          current_assignment?: string | null
          current_officer_id?: string | null
          fuel_level?: number | null
          id?: string
          is_active?: boolean | null
          last_gps_lat?: number | null
          last_gps_lng?: number | null
          last_gps_update?: string | null
          mileage?: number | null
          region?: string | null
          registration_number?: string
          status?: string
          updated_at?: string | null
          vehicle_id?: string
          vehicle_type?: string
        }
        Relationships: []
      }
      welfare_events: {
        Row: {
          action_taken: string | null
          created_at: string | null
          escalated_to: string | null
          event_type: string
          gps_location: string | null
          guard_id: string
          handled_by_operator: string | null
          id: string
          last_known_activity: string | null
          resolution_notes: string | null
          resolved_at: string | null
          severity: string
          site_id: string | null
          status: string
          triggered_at: string
        }
        Insert: {
          action_taken?: string | null
          created_at?: string | null
          escalated_to?: string | null
          event_type: string
          gps_location?: string | null
          guard_id: string
          handled_by_operator?: string | null
          id?: string
          last_known_activity?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          site_id?: string | null
          status?: string
          triggered_at?: string
        }
        Update: {
          action_taken?: string | null
          created_at?: string | null
          escalated_to?: string | null
          event_type?: string
          gps_location?: string | null
          guard_id?: string
          handled_by_operator?: string | null
          id?: string
          last_known_activity?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          site_id?: string | null
          status?: string
          triggered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "welfare_events_guard_id_fkey"
            columns: ["guard_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "welfare_events_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          created_at: string
          id: string
          is_incoming: boolean
          media_url: string | null
          message_text: string
          read_at: string | null
          replied_by: string | null
          sender_name: string | null
          sender_number: string
          ticket_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_incoming?: boolean
          media_url?: string | null
          message_text: string
          read_at?: string | null
          replied_by?: string | null
          sender_name?: string | null
          sender_number: string
          ticket_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_incoming?: boolean
          media_url?: string | null
          message_text?: string
          read_at?: string | null
          replied_by?: string | null
          sender_name?: string | null
          sender_number?: string
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_replied_by_fkey"
            columns: ["replied_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "communication_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auth_role: { Args: never; Returns: string }
      check_expiring_certifications: {
        Args: never
        Returns: {
          certification_type: string
          days_until_expiry: number
          expiry_date: string
          staff_id: string
          staff_name: string
        }[]
      }
      generate_document_number: { Args: never; Returns: string }
      generate_equipment_id: { Args: never; Returns: string }
      generate_evidence_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_elevated_user: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "ceo"
        | "coo"
        | "control_room_officer"
        | "operations_supervisor"
        | "hr_custodian"
        | "administrator"
        | "bdo"
        | "system_admin"
      call_priority_type: "low" | "normal" | "high" | "emergency"
      call_status_type:
        | "ringing"
        | "on_call"
        | "on_hold"
        | "ended"
        | "missed"
        | "abandoned"
      communication_channel_type:
        | "phone"
        | "whatsapp"
        | "sms"
        | "email"
        | "web_form"
        | "radio"
        | "internal"
      contract_status: "active" | "pending_renewal" | "expired" | "terminated"
      document_category:
        | "staff_certification"
        | "contract"
        | "handbook"
        | "policy_procedure"
        | "sop"
        | "training_material"
        | "investigation"
        | "hr_employment"
        | "employee_contract"
        | "job_description"
        | "employee_handbook"
        | "leave_policy"
        | "nda"
        | "health_safety"
        | "risk_assessment"
        | "incident_report"
        | "safety_certificate"
        | "emergency_plan"
        | "financial"
        | "financial_statement"
        | "audit_report"
        | "tax_document"
        | "invoice_template"
        | "operational"
        | "process_documentation"
        | "work_instruction"
        | "psra_license"
        | "first_aid"
        | "drivers_license"
        | "firearms_license"
        | "client_management"
        | "client_contract"
        | "service_agreement"
        | "proposal"
        | "site_sop"
        | "policy"
        | "code_of_conduct"
        | "ethics_policy"
        | "security_policy"
        | "vehicle_policy"
      document_status: "active" | "expired" | "pending_review" | "archived"
      leave_type:
        | "annual"
        | "sick"
        | "maternity"
        | "paternity"
        | "compassionate"
      operator_status_type:
        | "available"
        | "on_call"
        | "on_wrap_up"
        | "break"
        | "logged_out"
      payment_status: "paid" | "pending" | "overdue"
      risk_tier: "low" | "medium" | "high" | "critical"
      risk_trend: "improving" | "stable" | "worsening"
      staff_status:
        | "active"
        | "off_duty"
        | "on_leave"
        | "suspended"
        | "terminated"
        | "transferred"
        | "resigned"
        | "deserted"
      ticket_status_type:
        | "new"
        | "assigned"
        | "in_progress"
        | "escalated"
        | "resolved"
        | "closed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "ceo",
        "coo",
        "control_room_officer",
        "operations_supervisor",
        "hr_custodian",
        "administrator",
        "bdo",
        "system_admin",
      ],
      call_priority_type: ["low", "normal", "high", "emergency"],
      call_status_type: [
        "ringing",
        "on_call",
        "on_hold",
        "ended",
        "missed",
        "abandoned",
      ],
      communication_channel_type: [
        "phone",
        "whatsapp",
        "sms",
        "email",
        "web_form",
        "radio",
        "internal",
      ],
      contract_status: ["active", "pending_renewal", "expired", "terminated"],
      document_category: [
        "staff_certification",
        "contract",
        "handbook",
        "policy_procedure",
        "sop",
        "training_material",
        "investigation",
        "hr_employment",
        "employee_contract",
        "job_description",
        "employee_handbook",
        "leave_policy",
        "nda",
        "health_safety",
        "risk_assessment",
        "incident_report",
        "safety_certificate",
        "emergency_plan",
        "financial",
        "financial_statement",
        "audit_report",
        "tax_document",
        "invoice_template",
        "operational",
        "process_documentation",
        "work_instruction",
        "psra_license",
        "first_aid",
        "drivers_license",
        "firearms_license",
        "client_management",
        "client_contract",
        "service_agreement",
        "proposal",
        "site_sop",
        "policy",
        "code_of_conduct",
        "ethics_policy",
        "security_policy",
        "vehicle_policy",
      ],
      document_status: ["active", "expired", "pending_review", "archived"],
      leave_type: ["annual", "sick", "maternity", "paternity", "compassionate"],
      operator_status_type: [
        "available",
        "on_call",
        "on_wrap_up",
        "break",
        "logged_out",
      ],
      payment_status: ["paid", "pending", "overdue"],
      risk_tier: ["low", "medium", "high", "critical"],
      risk_trend: ["improving", "stable", "worsening"],
      staff_status: [
        "active",
        "off_duty",
        "on_leave",
        "suspended",
        "terminated",
        "transferred",
        "resigned",
        "deserted",
      ],
      ticket_status_type: [
        "new",
        "assigned",
        "in_progress",
        "escalated",
        "resolved",
        "closed",
      ],
    },
  },
} as const
