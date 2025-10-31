"""
Management command to seed the A340 job with all its processes.
Usage: python manage.py seed_a340_job
"""
from django.core.management.base import BaseCommand
from core.models import Job, Process


class Command(BaseCommand):
    help = 'Seeds the A340 job with all predefined processes'

    def handle(self, *args, **options):
        # Create or get the A340 job
        job, created = Job.objects.get_or_create(
            name='A340',
            defaults={
                'description': 'A340 Assembly and Quality Control Process'
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created job: {job.name}'))
        else:
            self.stdout.write(self.style.WARNING(f'Job {job.name} already exists. Updating processes...'))
            # Clear existing processes to avoid duplicates
            job.processes.all().delete()

        # Define all processes
        processes = []
        order = 1
        
        # Quality processes (all are quality type)
        quality_processes = [
            ('Quality Assemblage I', 18 * 60),
            ('Quality Assemblage II', 10 * 60),
            ('Final inspection', 13 * 60),
            ('Packing', 10 * 60),
        ]
        
        for operation_name, time_seconds in quality_processes:
            processes.append(Process(
                job=job,
                operation_name=operation_name,
                standard_time_seconds=time_seconds,
                task_type='quality',
                order=order
            ))
            order += 1
        
        # Test processes (all are quality type)
        test_processes = [
            ('Adjustment', 37 * 60),
            ('Unit Test', 20 * 60),
            ('Immersion', 3 * 60),
        ]
        
        for operation_name, time_seconds in test_processes:
            processes.append(Process(
                job=job,
                operation_name=operation_name,
                standard_time_seconds=time_seconds,
                task_type='quality',
                order=order
            ))
            order += 1
        
        # Production processes (technician type)
        production_processes = [
            ('Assemblage I', 32 * 60),
            ('Assemblage II', 30 * 60),
            ('Assemblage II tubeless', 13 * 60),
            ('Final Touch - Cleaning&Packing', 10 * 60),
            ('Final Touch - Paint&Labeling', 15 * 60),
            ('Final Touch - Purge Vulve&Cleaning', 5 * 60),
            ('FocusA340', 20 * 60),
            ('FocusA360', 10 * 60),
            ('Lens Cleaning', 35 * 60),
            ('Objective and Doublet', 24 * 60),
            ('Nitrogen', 10 * 60),
        ]
        
        for operation_name, time_seconds in production_processes:
            processes.append(Process(
                job=job,
                operation_name=operation_name,
                standard_time_seconds=time_seconds,
                task_type='technician',
                order=order
            ))
            order += 1
        
        # Sub-Assemblies (technician type)
        sub_assemblies = [
            ('Battery Contact Assy.', 4 * 60),
            ('Battery Cover Assy.', 2 * 60),
            ('Beam Combiner Assy.', 15 * 60),
            ('Cover Assy.', 30 * 60),
            ('Eyepiece Assy.', 15 * 60),
            ('Focus Assy.A340', 30 * 60),
            ('Focus Assy.A360', 40 * 60),
            ('Reticle Assy.', 30 * 60),
            ('Tube Assy.', 16 * 60),
        ]
        
        for operation_name, time_seconds in sub_assemblies:
            processes.append(Process(
                job=job,
                operation_name=operation_name,
                standard_time_seconds=time_seconds,
                task_type='technician',
                order=order
            ))
            order += 1
        
        # Troubleshooting (technician type)
        troubleshooting = [
            ('Adaptors Installation', 3 * 60),
            ('Add Tube Spacers', 45 * 60),
            ('Adjust the Fiber Optic', 10 * 60),
            ('Adjusters', 5 * 60),
            ('Attaching Label', 1 * 60),
            ('Bushing Installation', 2 * 60),
            ('Change Battery contact', 10 * 60),
            ('Change Beam', 7 * 60),
            ('Change Eye Piece', 3 * 60),
            ('Change Power Card', 30 * 60),
            ('Change Reticle', 2 * 60),
            ('Change Reticle-Assy.II', 7 * 60),
            ('Clean the Reticle', 5 * 60),
            ('Clean Assemblage 1', 5 * 60),
            ('Clean Assemblage 2', 3 * 60),
            ('Contact Battery Installation', 2 * 60),
            ('Cover Assembly Only', 3 * 60),
            ('Cover Lacing', int(1.5 * 60)),
            ('Cover lacing and macaroon', 3 * 60),
            ('Cover Silicon', 5 * 60),
            ('Dirt on Beam-Assy.I', 8 * 60),
            ('Dirt on Beam-Assy.II', 5 * 60),
            ('Dirt on Eye Piece', 3 * 60),
            ('Dirt on Objective Lens', 45 * 60),
            ('Dirt on Tube', 45 * 60),
            ('Dirt on Tube- Air blow gun', 3 * 60),
            ('Disassemble Assemblage I', 11 * 60),
            ('Epoxy on Blue Wire', 1 * 60),
            ('ESD Line Test', 10 * 60),
            ('Eyepiece Friction', 7 * 60),
            ('Filing Doublet', 20 * 60),
            ('Focus Dirt and reassembly', 15 * 60),
            ('Focus Shaft and Hub', 10 * 60),
            ('Focus Knob', 32 * 60),
            ('Focus Movement', 5 * 60),
            ('Focus Sub-Assembly Filling', 15 * 60),
            ('Housing Cleaning', 5 * 60),
            ('Install Cover Assy.', 2 * 60),
            ('Label Printing', int(0.3 * 60)),
            ('Nitrogen Leakage', 8 * 60),
            ('Objective Lens Leakage', 15 * 60),
            ('Objective Lens Reassemblage', 30 * 60),
            ('Photoresistor Cover Installation', 2 * 60),
            ('Photoresistor Plug Replacement', 20 * 60),
            ('Power Card Installation', 4 * 60),
            ('Power Card not Working', 30 * 60),
            ('Quality tube check', 20 * 60),
            ('Reassemblage II', 20 * 60),
            ('Repaint and Device Cleaning', 10 * 60),
            ('Reticle Assembly Only', 5 * 60),
            ('Reticle Label', 2 * 60),
            ('Reticle Label and cleaning Troubeshooting', 5 * 60),
            ('Reticle Lens Cleaning', 2 * 60),
            ('Reticle Soldering', 7 * 60),
            ('Troubleshooting reticle (410)', 14 * 60),
            ('RTV', 8 * 60),
            ('Soldering Card Blue Wire', 3 * 60),
            ('Soldering Cover Assy.', 16 * 60),
            ('Soldering Tube Housing', 3 * 60),
            ('Stamp Traveller Forms', 3 * 60),
            ('Threading', 5 * 60),
            ('Tight Main Body- Focus', 20 * 60),
            ('Wire Stripping', 1 * 60),
            ('Clean beam and tube', 10 * 60),
            ('Return to Assy 1', 17 * 60),
        ]
        
        for operation_name, time_seconds in troubleshooting:
            processes.append(Process(
                job=job,
                operation_name=operation_name,
                standard_time_seconds=time_seconds,
                task_type='technician',
                order=order
            ))
            order += 1
        
        # Bulk create all processes
        Process.objects.bulk_create(processes)
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {len(processes)} processes for job {job.name}'
            )
        )
        
        # Print summary
        self.stdout.write(self.style.SUCCESS('\nSummary:'))
        self.stdout.write(f'  Quality processes: {sum(1 for p in processes if p.task_type == "quality")}')
        self.stdout.write(f'  Technician processes: {sum(1 for p in processes if p.task_type == "technician")}')
        self.stdout.write(f'  Total processes: {len(processes)}')
