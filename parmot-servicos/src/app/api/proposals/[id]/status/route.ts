import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { updateProposal, getProposalById, getServiceRequestById, updateServiceRequest, createWork } from '@/lib/database-memory';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        
        { status: 401 }
      );
    }

    if (user.type !== 'client') {
      return NextResponse.json(
        { error: 'Apenas clientes podem aceitar/rejeitar propostas' },
        { status: 403 }
      );
    }

    const proposalId = params.id;
    const { status } = await request.json();

    if (!status || !['accepted', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido. Use "accepted" ou "rejected"' },
        { status: 400 }
      );
    }

    const proposal = getProposalById(proposalId);
    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposta não encontrada' },
        { status: 404 }
      );
    }

    const serviceRequest = getServiceRequestById(proposal.serviceRequestId);
    if (!serviceRequest) {
      return NextResponse.json(
        { error: 'Solicitação não encontrada' },
        { status: 404 }
      );
    }

    // Verify that the current user owns the service request
    if (serviceRequest.userId !== user.id) {
      return NextResponse.json(
        { error: 'Você só pode aceitar/rejeitar propostas das suas próprias solicitações' },
        { status: 403 }
      );
    }

    // Update the proposal status
    const updatedProposal = updateProposal(proposalId, { status });

    // If accepting a proposal, update the service request status to in_progress
    // and reject all other pending proposals
    if (status === 'accepted') {
      updateServiceRequest(proposal.serviceRequestId, { 
        status: 'in_progress' 
      });

      // Reject all other pending proposals for this service request
      const { getProposalsByServiceRequestId } = require('@/lib/database-memory');
      const allProposals = getProposalsByServiceRequestId(proposal.serviceRequestId);
      
      allProposals.forEach((otherProposal: any) => {
        if (otherProposal.id !== proposalId && otherProposal.status === 'pending') {
          updateProposal(otherProposal.id, { status: 'rejected' });
        }
      });

      // Create a work record for the accepted proposal
      createWork({
        proposalId,
        serviceRequestId: proposal.serviceRequestId,
        clientId: serviceRequest.userId,
        professionalId: proposal.professionalId,
        title: serviceRequest.title,
        description: proposal.description,
        price: proposal.price,
        estimatedDuration: proposal.estimatedDuration,
        startDate: proposal.startDate,
        paymentTerms: proposal.paymentTerms,
      });
    }

    return NextResponse.json({
      success: true,
      proposal: updatedProposal,
      message: status === 'accepted' ? 'Proposta aceita com sucesso!' : 'Proposta rejeitada'
    });
  } catch (error) {
    console.error('Error updating proposal status:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}